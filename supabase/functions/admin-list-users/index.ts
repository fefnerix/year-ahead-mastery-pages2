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

    const userId = user.id;

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
    const statusFilter = url.searchParams.get("status") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const perPage = Math.min(parseInt(url.searchParams.get("per_page") || "50", 10), 100);

    // List users from auth.users
    const { data: authData, error: listErr } =
      await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) throw listErr;

    const users = authData?.users || [];

    // Get profiles
    const { data: profiles } = await serviceClient
      .from("profiles")
      .select("user_id, display_name, avatar_url");
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    // Get entitlements
    const { data: product } = await serviceClient
      .from("access_products")
      .select("id")
      .eq("code", "progress_2026")
      .single();

    let entitlementMap = new Map<string, any>();
    if (product) {
      const { data: entitlements } = await serviceClient
        .from("access_entitlements")
        .select("user_id, status, source, id")
        .eq("product_id", product.id);
      for (const e of entitlements || []) {
        entitlementMap.set(e.user_id, e);
      }
    }

    // Get roles
    const { data: roles } = await serviceClient
      .from("user_roles")
      .select("user_id, role");
    const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));

    // Get streaks
    const { data: streaks } = await serviceClient
      .from("user_streaks")
      .select("user_id, current_streak, max_streak, last_completed_date");
    const streakMap = new Map((streaks || []).map((s: any) => [s.user_id, s]));

    // Get current month for progress
    const now = new Date();
    // Use Sao Paulo timezone
    const brDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const currentMonth = brDate.getMonth() + 1;
    const currentYear = brDate.getFullYear();

    let currentMonthId: string | null = null;
    let monthTaskCount = 0;
    let monthCheckMap = new Map<string, number>();

    if (product) {
      // Find current month
      const { data: monthRow } = await serviceClient
        .from("months")
        .select("id")
        .eq("number", currentMonth)
        .eq("year", currentYear)
        .limit(1)
        .maybeSingle();

      if (monthRow) {
        currentMonthId = monthRow.id;

        // Count active month tasks
        const { count } = await serviceClient
          .from("month_tasks")
          .select("id", { count: "exact", head: true })
          .eq("month_id", currentMonthId)
          .eq("is_active", true);
        monthTaskCount = count || 0;

        // Get all month task checks for current month
        const { data: checks } = await serviceClient
          .from("month_task_checks")
          .select("user_id, month_task_id")
          .eq("month_id", currentMonthId)
          .eq("checked", true);

        for (const c of checks || []) {
          monthCheckMap.set(c.user_id, (monthCheckMap.get(c.user_id) || 0) + 1);
        }
      }
    }

    // Build result
    let result = users.map((u: any) => {
      const profile = profileMap.get(u.id);
      const ent = entitlementMap.get(u.id);
      const streak = streakMap.get(u.id);
      const monthCompleted = monthCheckMap.get(u.id) || 0;

      return {
        user_id: u.id,
        email: u.email || "",
        display_name: profile?.display_name || "",
        avatar_url: profile?.avatar_url || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
        access_status: ent?.status || "pending",
        access_source: ent?.source || null,
        entitlement_id: ent?.id || null,
        current_streak: streak?.current_streak || 0,
        max_streak: streak?.max_streak || 0,
        last_completed_date: streak?.last_completed_date || null,
        month_completed: monthCompleted,
        month_total: monthTaskCount,
        role: roleMap.get(u.id) || "user",
      };
    });

    // Filters
    if (q) {
      result = result.filter(
        (r: any) =>
          r.email.toLowerCase().includes(q) ||
          (r.display_name || "").toLowerCase().includes(q) ||
          r.user_id.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter((r: any) => r.access_status === statusFilter);
    }

    const roleFilter = url.searchParams.get("role") || "";
    if (roleFilter) {
      result = result.filter((r: any) => r.role === roleFilter);
    }

    // Sort: active first, then by email
    result.sort((a: any, b: any) => {
      const order: Record<string, number> = {
        active: 0, pending: 1, past_due: 2, blocked: 3, canceled: 4, revoked: 5,
      };
      const diff = (order[a.access_status] ?? 9) - (order[b.access_status] ?? 9);
      if (diff !== 0) return diff;
      return a.email.localeCompare(b.email);
    });

    const total = result.length;
    const start = (page - 1) * perPage;
    const paginated = result.slice(start, start + perPage);

    return new Response(
      JSON.stringify({ users: paginated, total, page, per_page: perPage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
