export function formatMessageTime(ts: string | null): string {
  if (!ts) return "";

  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();

  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isSameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Calendar-week check (Mon–Sun)
  const startOfWeek = new Date(now);
  const day = (now.getDay() + 6) % 7; // make Monday=0
  startOfWeek.setDate(now.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const isThisWeek = d >= startOfWeek && d < endOfWeek;

  if (isThisWeek) {
    return d.toLocaleDateString([], { weekday: "short" });
  }

  const isSameYear = d.getFullYear() === now.getFullYear();

  return d.toLocaleDateString(
    [],
    isSameYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" }
  );
}
