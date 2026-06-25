import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isBugStatus } from "@/lib/bug-reports/validation";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const expectedKey = process.env.BUG_API_KEY;
  if (!expectedKey) {
    return Response.json({ error: "API not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("Authorization");
  const providedKey = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!providedKey || providedKey !== expectedKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status");
  const status = rawStatus !== null && isBugStatus(rawStatus) ? rawStatus : null;
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "50", 10), 1),
    200,
  );
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

  const adminSupabase = createAdminSupabaseClient();
  let query = adminSupabase
    .from("bug_reports")
    .select(
      "id, title, description, category, page_url, status, admin_note, created_at, updated_at, user_id, bug_report_files(id, file_name, file_size, mime_type)",
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  return Response.json({ data, count: data?.length ?? 0, offset, limit });
}
