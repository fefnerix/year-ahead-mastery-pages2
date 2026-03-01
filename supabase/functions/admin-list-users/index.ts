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
    // Verify caller is admin
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
    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub as string;

    // Check admin role using service role
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse query params
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.toLowerCase() || "";
    const programId = url.searchParams.get("program_id") || null;

    // List users from auth.users via admin API
    const { data: authData, error: listErr } =
      await serviceClient.auth.admin.listUsers({ perPage: 500 });

    if (listErr) throw listErr;

    const users = authData?.users || [];

    // Get profiles for display names
    const { data: profiles } = await serviceClient
      .from("profiles")
      .select("user_id, display_name, avatar_url");

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.user_id, p])
    );

    // Get entitlements if program_id provided
    let entitlementMap = new Map<string, any>();
    if (programId) {
      const { data: product } = await serviceClient
        .from("access_products")
        .select("id")
        .eq("code", "progress_2026")
        .single();

      if (product) {
        const { data: entitlements } = await serviceClient
          .from("access_entitlements")
          .select("user_id, status, source, id")
          .eq("product_id", product.id);

        for (const e of entitlements || []) {
          entitlementMap.set(e.user_id, e);
        }
      }
    }

    // Build result
    let result = users.map((u: any) => {
      const profile = profileMap.get(u.id);
      const ent = entitlementMap.get(u.id);
      return {
        user_id: u.id,
        email: u.email || "",
        display_name: profile?.display_name || "",
        avatar_url: profile?.avatar_url || null,
        created_at: u.created_at,
        access_status: ent?.status || "pending",
        access_source: ent?.source || null,
        entitlement_id: ent?.id || null,
      };
    });

    // Filter by search
    if (q) {
      result = result.filter(
        (r: any) =>
          r.email.toLowerCase().includes(q) ||
          (r.display_name || "").toLowerCase().includes(q)
      );
    }

    // Sort: active first, then by email
    result.sort((a: any, b: any) => {
      const order: Record<string, number> = { active: 0, pending: 1, past_due: 2, blocked: 3, canceled: 4, revoked: 5 };
      const diff = (order[a.access_status] ?? 9) - (order[b.access_status] ?? 9);
      if (diff !== 0) return diff;
      return a.email.localeCompare(b.email);
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
