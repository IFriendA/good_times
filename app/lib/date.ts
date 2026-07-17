export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function toTimeKey(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function currentTimeKey(): string {
  return toTimeKey(new Date());
}

export function entryTime(time: string | undefined, createdAt: string): string {
  if (time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return time;
  const createdDate = new Date(createdAt);
  return Number.isNaN(createdDate.getTime()) ? "12:00" : toTimeKey(createdDate);
}

export function entryDayOffset(
  dayOffset: number | undefined,
  journalDate: string,
  createdAt: string,
): 0 | 1 {
  if (dayOffset === 1) return 1;
  if (dayOffset === 0) return 0;
  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return 0;
  return toDateKey(createdDate) === shiftDate(journalDate, 1) ? 1 : 0;
}

export function entryTimeLabel(dayOffset: number | undefined, time: string | undefined, createdAt: string) {
  const value = entryTime(time, createdAt);
  return dayOffset === 1 ? `次日 ${value}` : value;
}

export function shiftDate(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function formatDate(dateKey: string, includeYear = true): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

export function shortDate(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
