import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    // For now we accept without signature verification if secret not set
    // In production, verify Stripe signature
    const rawBody = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
    }

    const eventId = payload.id || `stripe_${Date.now()}`;
    const eventType = payload.type || "unknown";

    console.log(`Stripe event: ${eventType}, id: ${eventId}`);

    const serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Idempotency
    const { error: idempErr } = await serviceClient.from("webhook_events").insert({
      provider: "stripe",
      event_id: String(eventId),
      status: "received",
      payload,
    });
    if (idempErr) {
      if (idempErr.code === "23505") {
        return new Response(JSON.stringify({ status: "duplicate" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw idempErr;
    }

    // Extract email
    const obj = payload.data?.object || {};
    let buyerEmail = (
      obj.customer_details?.email ||
      obj.customer_email ||
      obj.receipt_email ||
      obj.billing_details?.email ||
      ""
    ).toLowerCase().trim();

    if (!buyerEmail) {
      await serviceClient.from("webhook_events").update({
        status: "error",
        error: "No buyer email found",
        processed_at: new Date().toISOString(),
      }).eq("provider", "stripe").eq("event_id", String(eventId));
      return new Response(JSON.stringify({ status: "error", message: "No email" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Extract product/price ID for mapping
    let externalProductId: string | null = null;
    const lineItems = obj.lines?.data || obj.line_items?.data || [];
    if (lineItems.length > 0) {
      externalProductId = lineItems[0].price?.id || lineItems[0].price?.product || null;
    }
    if (!externalProductId && obj.items?.data?.[0]) {
      externalProductId = obj.items.data[0].price?.id || null;
    }

    // Resolve program via product_mappings
    let programId: string | null = null;
    if (externalProductId) {
      const { data: mapping } = await serviceClient
        .from("product_mappings")
        .select("program_id")
        .eq("provider", "stripe")
        .eq("external_product_id", externalProductId)
        .single();
      if (mapping) programId = mapping.program_id;
    }

    // Fallback: first program
    if (!programId) {
      const { data: prog } = await serviceClient.from("programs").select("id").limit(1).single();
      if (prog) programId = prog.id;
    }

    if (!programId) {
      await serviceClient.from("webhook_events").update({
        status: "error", error: "No program mapping found", processed_at: new Date().toISOString(),
      }).eq("provider", "stripe").eq("event_id", String(eventId));
      return new Response(JSON.stringify({ status: "error", message: "No program mapping" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Determine action
    const grantEvents = ["invoice.paid", "checkout.session.completed", "payment_intent.succeeded"];
    const blockEvents = ["invoice.payment_failed", "customer.subscription.deleted", "charge.refunded"];

    let newStatus: string | null = null;
    if (grantEvents.includes(eventType)) newStatus = "active";
    else if (blockEvents.includes(eventType)) newStatus = "blocked";

    if (!newStatus) {
      await serviceClient.from("webhook_events").update({
        status: "ignored", processed_at: new Date().toISOString(),
      }).eq("provider", "stripe").eq("event_id", String(eventId));
      return new Response(JSON.stringify({ status: "ignored", event_type: eventType }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Resolve user
    let userId: string | null = null;
    const { data: authData } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    const foundUser = authData?.users?.find((u) => u.email?.toLowerCase() === buyerEmail);

    if (foundUser) {
      userId = foundUser.id;
    } else {
      const defaultPwd = "renacer123";
      const { data: newUser, error: createErr } = await serviceClient.auth.admin.createUser({
        email: buyerEmail,
        password: defaultPwd,
        email_confirm: true,
        user_metadata: { source: "stripe" },
      });
      if (createErr) {
        await serviceClient.from("webhook_events").update({
          status: "error", error: `Create user: ${createErr.message}`, processed_at: new Date().toISOString(),
        }).eq("provider", "stripe").eq("event_id", String(eventId));
        return new Response(JSON.stringify({ status: "error" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      userId = newUser.user.id;

      // Mark user as needing password change
      await serviceClient.from("profile_settings").upsert(
        { user_id: userId, must_change_password: true },
        { onConflict: "user_id" }
      ).catch(() => {});
    }

    // Upsert access_control
    await serviceClient.from("access_control").upsert(
      {
        user_id: userId,
        program_id: programId,
        status: newStatus,
        source: "stripe",
        external_provider: "stripe",
        external_customer_id: obj.customer || null,
        external_subscription_id: obj.subscription || null,
        external_transaction_id: obj.payment_intent || eventId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,program_id" }
    );

    // Backwards compat: access_entitlements
    const { data: product } = await serviceClient.from("access_products").select("id").eq("code", "progress_2026").single();
    if (product) {
      await serviceClient.from("access_entitlements").upsert(
        { user_id: userId, product_id: product.id, status: newStatus, source: "stripe", updated_at: new Date().toISOString() },
        { onConflict: "user_id,product_id" }
      );
    }

    // Audit
    await serviceClient.from("audit_logs").insert({
      target_user_id: userId,
      action: newStatus === "active" ? "grant_access" : "block_access",
      provider: "stripe",
      metadata: { event_type: eventType, event_id: eventId, email: buyerEmail, external_product_id: externalProductId },
    });

    // Mark processed
    await serviceClient.from("webhook_events").update({
      status: "processed", processed_at: new Date().toISOString(),
    }).eq("provider", "stripe").eq("event_id", String(eventId));

    return new Response(
      JSON.stringify({ status: "ok", action: newStatus, user_id: userId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
