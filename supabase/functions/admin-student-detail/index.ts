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

    const adminId = user.id;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: adminId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const studentId = url.searchParams.get("user_id");
    if (!studentId) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get auth user
    const { data: authUser, error: authErr } =
      await serviceClient.auth.admin.getUserById(studentId);
    if (authErr || !authUser?.user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = authUser.user;

    // Profile
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("user_id", studentId)
      .maybeSingle();

    // Entitlements
    const { data: entitlements } = await serviceClient
      .from("access_entitlements")
      .select("*, access_products(name, code)")
      .eq("user_id", studentId);

    // Streak
    const { data: streak } = await serviceClient
      .from("user_streaks")
      .select("*")
      .eq("user_id", studentId)
      .maybeSingle();

    // Current month progress
    const now = new Date();
    const brDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const currentMonth = brDate.getMonth() + 1;
    const currentYear = brDate.getFullYear();

    const { data: monthRow } = await serviceClient
      .from("months")
      .select("id, name, number, year")
      .eq("number", currentMonth)
      .eq("year", currentYear)
      .limit(1)
      .maybeSingle();

    let monthProgress = { completed: 0, total: 0, tasks: [] as any[] };

    if (monthRow) {
      // Get all active month tasks
      const { data: tasks } = await serviceClient
        .from("month_tasks")
        .select("id, title, sort_order, description")
        .eq("month_id", monthRow.id)
        .eq("is_active", true)
        .order("sort_order");

      // Get checks
      const { data: checks } = await serviceClient
        .from("month_task_checks")
        .select("month_task_id")
        .eq("month_id", monthRow.id)
        .eq("user_id", studentId)
        .eq("checked", true);

      const checkedSet = new Set((checks || []).map((c: any) => c.month_task_id));

      monthProgress = {
        completed: checkedSet.size,
        total: (tasks || []).length,
        tasks: (tasks || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          sort_order: t.sort_order,
          completed: checkedSet.has(t.id),
        })),
      };
    }

    // Subtask progress for current month
    let subtaskProgress = { completed: 0, total: 0 };
    if (monthRow) {
      const { data: subtasks } = await serviceClient
        .from("month_task_subtasks")
        .select("id, month_task_id")
        .eq("is_active", true);

      // filter subtasks belonging to tasks in current month
      const monthTaskIds = monthProgress.tasks.map((t: any) => t.id);
      const relevantSubtasks = (subtasks || []).filter((s: any) =>
        monthTaskIds.includes(s.month_task_id)
      );

      const { data: subtaskChecks } = await serviceClient
        .from("month_task_subtask_checks")
        .select("subtask_id")
        .eq("month_id", monthRow.id)
        .eq("user_id", studentId)
        .eq("checked", true);

      const checkedSubtasks = new Set(
        (subtaskChecks || []).map((c: any) => c.subtask_id)
      );

      subtaskProgress = {
        total: relevantSubtasks.length,
        completed: relevantSubtasks.filter((s: any) => checkedSubtasks.has(s.id)).length,
      };
    }

    // Recent access actions (audit)
    const { data: recentActions } = await serviceClient
      .from("access_actions")
      .select("action, reason, created_at, actor_user_id")
      .eq("user_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Month task notes
    const { data: taskNotes } = await serviceClient
      .from("month_task_notes")
      .select("id, note, created_at, month_task_id")
      .eq("user_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Journal entries
    const { data: journals } = await serviceClient
      .from("journal_entries")
      .select("id, content, date, created_at")
      .eq("user_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10);

    const result = {
      user_id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      profile: profile || { display_name: "", avatar_url: null },
      entitlements: entitlements || [],
      streak: streak || { current_streak: 0, max_streak: 0, last_completed_date: null },
      current_month: monthRow
        ? { id: monthRow.id, name: monthRow.name, number: monthRow.number, year: monthRow.year }
        : null,
      month_progress: monthProgress,
      subtask_progress: subtaskProgress,
      recent_actions: recentActions || [],
      task_notes: taskNotes || [],
      journals: journals || [],
    };

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
