export type ActivityEntry = {
  id: string;
  date: string;
  time?: string;
  dayOffset?: 0 | 1;
  title: string;
  detail: string;
  engagement: number;
  energy: number;
  flow: boolean;
  hidden?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BackupFile = {
  app: "good-times-journal";
  version: 1;
  exportedAt: string;
  entries: ActivityEntry[];
};

export function isActivityEntry(value: unknown): value is ActivityEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<ActivityEntry>;

  return (
    typeof entry.id === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? "") &&
    (entry.time === undefined || /^([01]\d|2[0-3]):[0-5]\d$/.test(entry.time)) &&
    (entry.dayOffset === undefined || entry.dayOffset === 0 || entry.dayOffset === 1) &&
    typeof entry.title === "string" &&
    typeof entry.detail === "string" &&
    typeof entry.engagement === "number" &&
    entry.engagement >= 0 &&
    entry.engagement <= 10 &&
    typeof entry.energy === "number" &&
    entry.energy >= -5 &&
    entry.energy <= 5 &&
    typeof entry.flow === "boolean" &&
    (entry.hidden === undefined || typeof entry.hidden === "boolean") &&
    typeof entry.createdAt === "string" &&
    typeof entry.updatedAt === "string"
  );
}
