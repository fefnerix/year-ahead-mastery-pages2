import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const actorId = user.id;

    const serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check admin
    const { data: isAdmin } = await serviceClient.rpc("has_role", { _user_id: actorId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { email, full_name, program_id, status = "active", reason, source = "manual" } = body;

    if (!email || !program_id) {
      return new Response(JSON.stringify({ error: "email and program_id required" }), { status: 400, headers: corsHeaders });
    }

    const normalEmail = email.toLowerCase().trim();

    // Find or create user
    let userId: string | null = null;
    const { data: authData } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    const found = authData?.users?.find((u) => u.email?.toLowerCase() === normalEmail);

    if (found) {
      userId = found.id;
      // Reset password to default if user was created with a random one
      if (body.reset_password) {
        await serviceClient.auth.admin.updateUserById(userId, { password: "renacer123" });
      }
    } else {
      // Create user with default password
      const tempPwd = "renacer123";
      const { data: newUser, error: createErr } = await serviceClient.auth.admin.createUser({
        email: normalEmail,
        password: tempPwd,
        email_confirm: true,
        user_metadata: { display_name: full_name || normalEmail.split("@")[0], source: "manual" },
      });
      if (createErr) throw new Error(`Could not create user: ${createErr.message}`);
      userId = newUser.user.id;
    }

    // Upsert access_control
    const { error: upsertErr } = await serviceClient
      .from("access_control")
      .upsert(
        {
          user_id: userId,
          program_id,
          status,
          source,
          reason: reason || null,
          external_provider: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,program_id" }
      );
    if (upsertErr) throw upsertErr;

    // Also upsert access_entitlements for backwards compat
    const { data: product } = await serviceClient
      .from("access_products")
      .select("id")
      .eq("code", "progress_2026")
      .single();
    if (product) {
      await serviceClient.from("access_entitlements").upsert(
        {
          user_id: userId,
          product_id: product.id,
          status,
          source,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,product_id" }
      );
    }

    // Audit log
    await serviceClient.from("audit_logs").insert({
      actor_user_id: actorId,
      target_user_id: userId,
      action: status === "active" ? "manual_grant" : status === "blocked" ? "manual_block" : "manual_update",
      provider: "manual",
      metadata: { email: normalEmail, program_id, status, reason, full_name },
    });

    return new Response(
      JSON.stringify({ user_id: userId, email: normalEmail, status, program_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("admin-manual-access error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
