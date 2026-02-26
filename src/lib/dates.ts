/**
 * Returns today's date as YYYY-MM-DD in America/Sao_Paulo timezone.
 * Ensures frontend and backend (Supabase RPCs) agree on "today".
 */
export function getTodayBRT(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
