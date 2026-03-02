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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const actorId = claims.claims.sub as string;

    const serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: isAdmin } = await serviceClient.rpc("has_role", { _user_id: actorId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { program_id, default_status = "active", rows } = body;

    if (!program_id || !Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "program_id and rows[] required" }), { status: 400, headers: corsHeaders });
    }

    // Get product for backwards compat
    const { data: product } = await serviceClient
      .from("access_products")
      .select("id")
      .eq("code", "progress_2026")
      .single();

    // Load all existing users once
    const { data: authData } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    const existingUsers = authData?.users || [];
    const emailMap = new Map<string, string>();
    for (const u of existingUsers) {
      if (u.email) emailMap.set(u.email.toLowerCase(), u.id);
    }

    const report = { created_users: 0, existing_users: 0, upserts: 0, errors: [] as { email: string; reason: string }[] };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const row of rows) {
      const email = (row.email || "").toLowerCase().trim();
      if (!email || !emailRegex.test(email)) {
        report.errors.push({ email: email || "(vacío)", reason: "Email inválido" });
        continue;
      }

      try {
        let userId = emailMap.get(email);

        if (userId) {
          report.existing_users++;
        } else {
          const tempPwd = crypto.randomUUID();
          const { data: newUser, error: createErr } = await serviceClient.auth.admin.createUser({
            email,
            password: tempPwd,
            email_confirm: true,
            user_metadata: { display_name: row.full_name || email.split("@")[0], source: "csv" },
          });
          if (createErr) {
            report.errors.push({ email, reason: createErr.message });
            continue;
          }
          userId = newUser.user.id;
          emailMap.set(email, userId);
          report.created_users++;
        }

        const rowStatus = row.status || default_status;

        // Upsert access_control
        await serviceClient.from("access_control").upsert(
          {
            user_id: userId,
            program_id,
            status: rowStatus,
            source: "csv",
            reason: row.reason || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,program_id" }
        );

        // Backwards compat: upsert access_entitlements
        if (product) {
          await serviceClient.from("access_entitlements").upsert(
            {
              user_id: userId,
              product_id: product.id,
              status: rowStatus,
              source: "csv",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,product_id" }
          );
        }

        report.upserts++;

        // Audit
        await serviceClient.from("audit_logs").insert({
          actor_user_id: actorId,
          target_user_id: userId,
          action: "import_csv",
          provider: "csv",
          metadata: { email, program_id, status: rowStatus, full_name: row.full_name },
        });
      } catch (e) {
        report.errors.push({ email, reason: e.message || "Unknown error" });
      }
    }

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-import-csv error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
