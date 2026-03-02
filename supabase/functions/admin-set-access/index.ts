import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await anonClient.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actorId = user.id;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: actorId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { user_id, status, source = "manual" } = body;

    if (!user_id || !status) {
      return new Response(
        JSON.stringify({ error: "user_id and status required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get product
    const { data: product } = await serviceClient
      .from("access_products")
      .select("id")
      .eq("code", "progress_2026")
      .single();

    if (!product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert entitlement
    const { error: upsertErr } = await serviceClient
      .from("access_entitlements")
      .upsert(
        {
          user_id,
          product_id: product.id,
          status,
          source,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,product_id" }
      );

    if (upsertErr) throw upsertErr;

    // Log action
    const actionMap: Record<string, string> = {
      active: "grant",
      pending: "suspend",
      past_due: "suspend",
      blocked: "block",
      revoked: "revoke",
      canceled: "revoke",
    };

    await serviceClient.from("access_actions").insert({
      action: actionMap[status] || "sync",
      user_id,
      product_id: product.id,
      actor_user_id: actorId,
      reason: `Manual: status -> ${status}`,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
