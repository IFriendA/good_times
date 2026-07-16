export type ActivityEntry = {
  id: string;
  date: string;
  title: string;
  detail: string;
  engagement: number;
  energy: number;
  flow: boolean;
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
    typeof entry.title === "string" &&
    typeof entry.detail === "string" &&
    typeof entry.engagement === "number" &&
    entry.engagement >= 0 &&
    entry.engagement <= 10 &&
    typeof entry.energy === "number" &&
    entry.energy >= -5 &&
    entry.energy <= 5 &&
    typeof entry.flow === "boolean" &&
    typeof entry.createdAt === "string" &&
    typeof entry.updatedAt === "string"
  );
}
