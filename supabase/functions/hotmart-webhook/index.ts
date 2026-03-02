import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hotmart-hottok",
};

// Definitive Hotmart event mapping
const EVENT_MAP: Record<string, { status: string; action: "grant" | "block" | "revoke" }> = {
  // A) Compra aprovada → active
  "PURCHASE_APPROVED": { status: "active", action: "grant" },
  "PURCHASE_COMPLETE": { status: "active", action: "grant" },
  // B) Compra atrasada → payment_pending (block)
  "PURCHASE_DELAYED": { status: "payment_pending", action: "block" },
  "PURCHASE_PAST_DUE": { status: "payment_pending", action: "block" },
  "SUBSCRIPTION_PAST_DUE": { status: "payment_pending", action: "block" },
  // C) Pedido de reembolso → refund_requested (block/hold)
  "REFUND_REQUESTED": { status: "refund_requested", action: "block" },
  // D) Compra reembolsada → refunded (revoke)
  "PURCHASE_REFUNDED": { status: "refunded", action: "revoke" },
  // E) Chargeback → chargeback (revoke + hard block)
  "PURCHASE_CHARGEBACK": { status: "chargeback", action: "revoke" },
  // F) Cancelamento → cancelled (revoke, unless period_end)
  "SUBSCRIPTION_CANCELLATION": { status: "cancelled", action: "revoke" },
  "PURCHASE_CANCELED": { status: "cancelled", action: "revoke" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. Validate secret
    const HOTMART_SECRET = Deno.env.get("HOTMART_WEBHOOK_SECRET");
    if (!HOTMART_SECRET) {
      console.error("HOTMART_WEBHOOK_SECRET not configured");
      return jsonResponse({ error: "Server misconfigured" }, 500);
    }

    const hottok = req.headers.get("x-hotmart-hottok");
    if (hottok !== HOTMART_SECRET) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // 2. Parse payload
    const payload = await req.json();
    const eventType = payload.event || payload.data?.event || "unknown";
    const providerEventId = payload.id || payload.data?.purchase?.transaction || `hotmart_${Date.now()}`;
    const buyerEmail = (payload.data?.buyer?.email || "").toString().toLowerCase().trim();
    const buyerId = payload.data?.buyer?.code || payload.data?.buyer?.ucode || providerEventId;
    const hotmartProductId = String(payload.data?.product?.id || payload.data?.product?.ucode || "");
    const periodEnd = payload.data?.subscription?.end_date || payload.data?.subscription?.period_end || null;

    console.log(`Hotmart event: ${eventType}, buyer: ${buyerEmail}, product: ${hotmartProductId}`);

    // 3. Init Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 4. Idempotency check
    const { error: idempErr } = await supabase.from("webhook_events").insert({
      provider: "hotmart",
      event_id: String(providerEventId),
      status: "received",
      payload,
    });
    if (idempErr) {
      if (idempErr.code === "23505") {
        console.log("Duplicate event:", providerEventId);
        return jsonResponse({ status: "duplicate" });
      }
      throw idempErr;
    }

    // 5. Validate buyer email
    if (!buyerEmail) {
      await markEvent(supabase, providerEventId, "error", "No buyer email");
      return jsonResponse({ status: "error", message: "No buyer email" });
    }

    // 6. Resolve event mapping
    const mapping = EVENT_MAP[eventType];
    if (!mapping) {
      await markEvent(supabase, providerEventId, "ignored");
      console.log(`Unknown/ignored event: ${eventType}`);
      return jsonResponse({ status: "ignored", event: eventType });
    }

    // 7. Resolve program via product_mappings
    let programId = await resolveProgramId(supabase, hotmartProductId);
    if (!programId) {
      await markEvent(supabase, providerEventId, "error", "No program mapping");
      return jsonResponse({ status: "error", message: "No program mapping" });
    }

    // 8. Resolve or create user
    const userId = await resolveOrCreateUser(supabase, buyerEmail, buyerId);
    if (!userId) {
      await markEvent(supabase, providerEventId, "error", "Failed to resolve user");
      return jsonResponse({ status: "error", message: "Failed to resolve user" });
    }

    // 9. Upsert provider identity
    await supabase.from("provider_identities").upsert(
      { provider: "hotmart", external_customer_id: String(buyerId), user_id: userId, email: buyerEmail },
      { onConflict: "provider,external_customer_id" },
    );

    // 10. Apply access control based on mapping
    let finalStatus = mapping.status;

    // F) Cancelamento: check period_end — if future, keep active until then
    if (eventType === "SUBSCRIPTION_CANCELLATION" && periodEnd) {
      const endDate = new Date(periodEnd);
      if (endDate > new Date()) {
        // Keep active until period end; just mark the cancellation intent
        finalStatus = "active"; // still active until period_end
        console.log(`Cancellation with future period_end ${periodEnd}, keeping active`);
      }
    }

    // Upsert access_control
    await supabase.from("access_control").upsert(
      {
        user_id: userId,
        program_id: programId,
        status: finalStatus,
        source: "hotmart",
        external_provider: "hotmart",
        external_customer_id: String(buyerId),
        external_transaction_id: String(providerEventId),
        reason: `Hotmart: ${eventType}`,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,program_id" },
    );

    // Backwards compat: access_entitlements
    await syncEntitlement(supabase, userId, finalStatus, mapping.action, buyerId, eventType, providerEventId);

    // E) Chargeback: hard block flag in profile_settings
    if (eventType === "PURCHASE_CHARGEBACK") {
      await supabase.from("profile_settings").upsert(
        { user_id: userId, must_change_password: true },
        { onConflict: "user_id" },
      ).catch(() => {});
    }

    // 11. Audit log
    await supabase.from("audit_logs").insert({
      target_user_id: userId,
      action: mapping.action === "grant" ? "grant_access" : mapping.action === "revoke" ? "revoke_access" : "block_access",
      provider: "hotmart",
      metadata: {
        event_type: eventType,
        event_id: providerEventId,
        email: buyerEmail,
        product_id: hotmartProductId,
        final_status: finalStatus,
        period_end: periodEnd,
      },
    });

    // 12. Mark processed
    await markEvent(supabase, providerEventId, "processed");

    return jsonResponse({ status: "ok", action: mapping.action, final_status: finalStatus, user_id: userId });
  } catch (err) {
    console.error("Hotmart webhook error:", err);
    return jsonResponse({ error: err.message || "Internal error" }, 500);
  }
});

// --- Helper functions ---

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function markEvent(supabase: any, eventId: string, status: string, error?: string) {
  await supabase.from("webhook_events").update({
    status,
    error: error || null,
    processed_at: new Date().toISOString(),
  }).eq("provider", "hotmart").eq("event_id", String(eventId));
}

async function resolveProgramId(supabase: any, hotmartProductId: string): Promise<string | null> {
  if (hotmartProductId) {
    const { data: mapping } = await supabase
      .from("product_mappings")
      .select("program_id")
      .eq("provider", "hotmart")
      .eq("external_product_id", hotmartProductId)
      .single();
    if (mapping) return mapping.program_id;
  }
  // Fallback: first program
  const { data: prog } = await supabase.from("programs").select("id").limit(1).single();
  return prog?.id || null;
}

async function resolveOrCreateUser(supabase: any, email: string, buyerId: string): Promise<string | null> {
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const found = authData?.users?.find((u: any) => u.email?.toLowerCase() === email);

  if (found) return found.id;

  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email,
    password: "renacer123",
    email_confirm: true,
    user_metadata: { source: "hotmart", buyer_id: buyerId },
  });

  if (error) {
    console.error("Create user error:", error.message);
    return null;
  }

  // Flag password change
  await supabase.from("profile_settings").upsert(
    { user_id: newUser.user.id, must_change_password: true },
    { onConflict: "user_id" },
  ).catch(() => {});

  return newUser.user.id;
}

async function syncEntitlement(
  supabase: any, userId: string, finalStatus: string, action: string,
  buyerId: string, eventType: string, providerEventId: string,
) {
  const { data: product } = await supabase
    .from("access_products").select("id").eq("code", "progress_2026").single();
  if (!product) return;

  const entStatus = finalStatus === "active" ? "active"
    : ["refunded", "chargeback", "cancelled"].includes(finalStatus) ? "revoked"
    : "past_due";

  await supabase.from("access_entitlements").upsert(
    {
      user_id: userId,
      product_id: product.id,
      status: entStatus,
      source: "hotmart",
      external_customer_id: String(buyerId),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,product_id" },
  );

  await supabase.from("access_actions").insert({
    action: action === "grant" ? "grant" : "revoke",
    user_id: userId,
    product_id: product.id,
    reason: `Hotmart: ${eventType}`,
    meta: { event_type: eventType, provider_event_id: providerEventId, final_status: finalStatus },
  }).catch(() => {});
}
