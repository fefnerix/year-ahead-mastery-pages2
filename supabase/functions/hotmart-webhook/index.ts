import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hotmart-hottok",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate webhook secret (hottok)
    const HOTMART_SECRET = Deno.env.get("HOTMART_WEBHOOK_SECRET");
    if (!HOTMART_SECRET) {
      console.error("HOTMART_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hottok = req.headers.get("x-hotmart-hottok");
    if (hottok !== HOTMART_SECRET) {
      console.warn("Invalid hottok received");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse payload
    const payload = await req.json();
    const eventType = payload.event || payload.data?.event || "unknown";
    const providerEventId =
      payload.id ||
      payload.data?.purchase?.transaction ||
      `hotmart_${Date.now()}`;

    const buyerEmail = (
      payload.data?.buyer?.email ||
      payload.data?.buyer?.checkout_phone ||
      ""
    )
      .toString()
      .toLowerCase()
      .trim();

    const buyerId =
      payload.data?.buyer?.code ||
      payload.data?.buyer?.ucode ||
      providerEventId;

    console.log(
      `Hotmart event: ${eventType}, buyer: ${buyerEmail}, id: ${providerEventId}`
    );

    // 3. Init Supabase with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Idempotency check
    const { error: idempError } = await supabase
      .from("access_events")
      .insert({
        provider: "hotmart",
        provider_event_id: String(providerEventId),
        event_type: eventType,
        payload,
        status: "received",
      });

    if (idempError) {
      if (idempError.code === "23505") {
        // duplicate
        console.log("Duplicate event, ignoring:", providerEventId);
        return new Response(
          JSON.stringify({ status: "duplicate", event_id: providerEventId }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw idempError;
    }

    if (!buyerEmail) {
      await supabase
        .from("access_events")
        .update({
          status: "error",
          error: "No buyer email",
          processed_at: new Date().toISOString(),
        })
        .eq("provider", "hotmart")
        .eq("provider_event_id", String(providerEventId));

      return new Response(
        JSON.stringify({ status: "error", message: "No buyer email" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Resolve user by email
    let userId: string | null = null;

    // Try to find existing user
    const { data: existingUsers } =
      await supabase.auth.admin.listUsers({ perPage: 1000 });

    const foundUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === buyerEmail
    );

    if (foundUser) {
      userId = foundUser.id;
    } else {
      // Create user automatically
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: buyerEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { source: "hotmart", buyer_id: buyerId },
        });

      if (createError) {
        console.error("Error creating user:", createError);
        await supabase
          .from("access_events")
          .update({
            status: "error",
            error: `Create user failed: ${createError.message}`,
            processed_at: new Date().toISOString(),
          })
          .eq("provider", "hotmart")
          .eq("provider_event_id", String(providerEventId));

        return new Response(
          JSON.stringify({
            status: "error",
            message: "Could not create user",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      userId = newUser.user.id;
      console.log("Created new user:", userId, buyerEmail);
    }

    // 6. Upsert provider identity
    await supabase.from("provider_identities").upsert(
      {
        provider: "hotmart",
        external_customer_id: String(buyerId),
        user_id: userId,
        email: buyerEmail,
      },
      { onConflict: "provider,external_customer_id" }
    );

    // 7. Resolve product
    const { data: product } = await supabase
      .from("access_products")
      .select("id")
      .eq("code", "progress_2026")
      .single();

    if (!product) {
      throw new Error("Product progress_2026 not found");
    }

    // 8. Determine action based on event
    const grantEvents = [
      "PURCHASE_APPROVED",
      "PURCHASE_COMPLETE",
      "PURCHASE_PROTEST",
      "SUBSCRIPTION_ACTIVE",
    ];
    const revokeEvents = [
      "PURCHASE_REFUNDED",
      "PURCHASE_CHARGEBACK",
      "PURCHASE_CANCELED",
      "SUBSCRIPTION_CANCELLATION",
      "PURCHASE_DELAYED",
    ];

    let action: "grant" | "revoke" | null = null;
    let newStatus: string = "active";

    if (grantEvents.includes(eventType)) {
      action = "grant";
      newStatus = "active";
    } else if (revokeEvents.includes(eventType)) {
      action = "revoke";
      newStatus = eventType.includes("CANCEL") ? "canceled" : "revoked";
    }

    if (action) {
      // Upsert entitlement
      await supabase.from("access_entitlements").upsert(
        {
          user_id: userId,
          product_id: product.id,
          status: newStatus,
          source: "hotmart",
          external_customer_id: String(buyerId),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,product_id" }
      );

      // Log action
      await supabase.from("access_actions").insert({
        action,
        user_id: userId,
        product_id: product.id,
        reason: `Hotmart event: ${eventType}`,
        meta: { event_type: eventType, provider_event_id: providerEventId },
      });

      console.log(
        `Action ${action} for user ${userId}, status: ${newStatus}`
      );
    } else {
      console.log(`Unhandled event type: ${eventType}, ignoring`);
    }

    // 9. Mark event as processed
    await supabase
      .from("access_events")
      .update({
        status: action ? "processed" : "ignored",
        processed_at: new Date().toISOString(),
      })
      .eq("provider", "hotmart")
      .eq("provider_event_id", String(providerEventId));

    return new Response(
      JSON.stringify({
        status: "ok",
        action: action || "ignored",
        user_id: userId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Hotmart webhook error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
