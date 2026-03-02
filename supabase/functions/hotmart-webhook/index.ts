import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hotmart-hottok",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const HOTMART_SECRET = Deno.env.get("HOTMART_WEBHOOK_SECRET");
    if (!HOTMART_SECRET) {
      console.error("HOTMART_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hottok = req.headers.get("x-hotmart-hottok");
    if (hottok !== HOTMART_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const eventType = payload.event || payload.data?.event || "unknown";
    const providerEventId = payload.id || payload.data?.purchase?.transaction || `hotmart_${Date.now()}`;
    const buyerEmail = (payload.data?.buyer?.email || "").toString().toLowerCase().trim();
    const buyerId = payload.data?.buyer?.code || payload.data?.buyer?.ucode || providerEventId;
    const hotmartProductId = String(payload.data?.product?.id || payload.data?.product?.ucode || "");

    console.log(`Hotmart event: ${eventType}, buyer: ${buyerEmail}, product: ${hotmartProductId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Idempotency via webhook_events
    const { error: idempErr } = await supabase.from("webhook_events").insert({
      provider: "hotmart",
      event_id: String(providerEventId),
      status: "received",
      payload,
    });
    if (idempErr) {
      if (idempErr.code === "23505") {
        console.log("Duplicate event:", providerEventId);
        return new Response(JSON.stringify({ status: "duplicate" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw idempErr;
    }

    // Also save to legacy access_events for backwards compat
    await supabase.from("access_events").insert({
      provider: "hotmart",
      provider_event_id: String(providerEventId),
      event_type: eventType,
      payload,
      status: "received",
    }).catch(() => {}); // ignore if duplicate

    if (!buyerEmail) {
      await supabase.from("webhook_events").update({
        status: "error", error: "No buyer email", processed_at: new Date().toISOString(),
      }).eq("provider", "hotmart").eq("event_id", String(providerEventId));
      return new Response(JSON.stringify({ status: "error", message: "No buyer email" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve program via product_mappings
    let programId: string | null = null;
    if (hotmartProductId) {
      const { data: mapping } = await supabase
        .from("product_mappings")
        .select("program_id")
        .eq("provider", "hotmart")
        .eq("external_product_id", hotmartProductId)
        .single();
      if (mapping) programId = mapping.program_id;
    }

    // Fallback: first program
    if (!programId) {
      const { data: prog } = await supabase.from("programs").select("id").limit(1).single();
      if (prog) programId = prog.id;
    }

    if (!programId) {
      await supabase.from("webhook_events").update({
        status: "error", error: "No program mapping", processed_at: new Date().toISOString(),
      }).eq("provider", "hotmart").eq("event_id", String(providerEventId));
      return new Response(JSON.stringify({ status: "error", message: "No program mapping" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve user
    let userId: string | null = null;
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const foundUser = authData?.users?.find((u) => u.email?.toLowerCase() === buyerEmail);

    if (foundUser) {
      userId = foundUser.id;
    } else {
      const tempPwd = crypto.randomUUID();
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: buyerEmail,
        password: tempPwd,
        email_confirm: true,
        user_metadata: { source: "hotmart", buyer_id: buyerId },
      });
      if (createErr) {
        await supabase.from("webhook_events").update({
          status: "error", error: `Create user: ${createErr.message}`, processed_at: new Date().toISOString(),
        }).eq("provider", "hotmart").eq("event_id", String(providerEventId));
        return new Response(JSON.stringify({ status: "error" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = newUser.user.id;
    }

    // Upsert provider identity
    await supabase.from("provider_identities").upsert(
      { provider: "hotmart", external_customer_id: String(buyerId), user_id: userId, email: buyerEmail },
      { onConflict: "provider,external_customer_id" }
    );

    // Determine action
    const grantEvents = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "SUBSCRIPTION_ACTIVE"];
    const blockEvents = ["PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "PURCHASE_CANCELED", "SUBSCRIPTION_CANCELLATION"];

    let newStatus: string | null = null;
    if (grantEvents.includes(eventType)) newStatus = "active";
    else if (blockEvents.includes(eventType)) newStatus = "blocked";

    if (newStatus) {
      // Upsert access_control (new source of truth)
      await supabase.from("access_control").upsert(
        {
          user_id: userId,
          program_id: programId,
          status: newStatus,
          source: "hotmart",
          external_provider: "hotmart",
          external_customer_id: String(buyerId),
          external_transaction_id: String(providerEventId),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,program_id" }
      );

      // Backwards compat: access_entitlements
      const { data: product } = await supabase.from("access_products").select("id").eq("code", "progress_2026").single();
      if (product) {
        await supabase.from("access_entitlements").upsert(
          {
            user_id: userId, product_id: product.id,
            status: newStatus === "active" ? "active" : (eventType.includes("CANCEL") ? "canceled" : "revoked"),
            source: "hotmart", external_customer_id: String(buyerId),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,product_id" }
        );
        // Legacy access_actions
        await supabase.from("access_actions").insert({
          action: newStatus === "active" ? "grant" : "revoke",
          user_id: userId, product_id: product.id,
          reason: `Hotmart event: ${eventType}`,
          meta: { event_type: eventType, provider_event_id: providerEventId },
        }).catch(() => {});
      }

      // Audit
      await supabase.from("audit_logs").insert({
        target_user_id: userId,
        action: newStatus === "active" ? "grant_access" : "block_access",
        provider: "hotmart",
        metadata: { event_type: eventType, event_id: providerEventId, email: buyerEmail, product_id: hotmartProductId },
      });
    }

    // Mark processed
    await supabase.from("webhook_events").update({
      status: newStatus ? "processed" : "ignored",
      processed_at: new Date().toISOString(),
    }).eq("provider", "hotmart").eq("event_id", String(providerEventId));

    await supabase.from("access_events").update({
      status: newStatus ? "processed" : "ignored",
      processed_at: new Date().toISOString(),
    }).eq("provider", "hotmart").eq("provider_event_id", String(providerEventId)).catch(() => {});

    return new Response(
      JSON.stringify({ status: "ok", action: newStatus || "ignored", user_id: userId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Hotmart webhook error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
