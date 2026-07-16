import { formatDate } from "./date";
import { ActivityEntry, BackupFile } from "./types";

const COLORS = {
  ink: "#29241f",
  muted: "#766e63",
  paper: "#f7f1e6",
  card: "#fffdf8",
  line: "#ded4c4",
  green: "#61745a",
  coral: "#c86f50",
  gold: "#d5a948",
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportBackup(entries: ActivityEntry[]) {
  const backup: BackupFile = {
    app: "good-times-journal",
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, `美好时光日志-备份-${new Date().toISOString().slice(0, 10)}.json`);
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const characters = Array.from(text);
  const lines: string[] = [];
  let current = "";

  for (const character of characters) {
    const next = current + character;
    if (context.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = character;
      if (lines.length === maxLines) break;
    } else {
      current = next;
    }
  }

  if (lines.length < maxLines && current) lines.push(current);
  if (lines.join("").length < text.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, -1)}…`;
  }
  return lines;
}

function drawMeter(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  value: number,
  min: number,
  max: number,
  color: string,
) {
  context.fillStyle = COLORS.line;
  context.beginPath();
  context.roundRect(x, y, width, 12, 6);
  context.fill();
  const progress = Math.max(0, Math.min(1, (value - min) / (max - min)));
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x, y, Math.max(12, width * progress), 12, 6);
  context.fill();
}

function makeDailyCanvas(date: string, entries: ActivityEntry[]): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法生成分享图片");

  context.fillStyle = COLORS.paper;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = COLORS.green;
  context.beginPath();
  context.arc(930, 105, 170, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255,255,255,.16)";
  context.beginPath();
  context.arc(930, 105, 100, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = COLORS.ink;
  context.font = '700 64px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.fillText("美好时光日志", 72, 112);
  context.fillStyle = COLORS.muted;
  context.font = '400 30px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.fillText(formatDate(date), 76, 166);

  const visibleEntries = entries.slice(0, 6);
  let y = 222;

  visibleEntries.forEach((entry, index) => {
    const cardHeight = entry.detail ? 178 : 144;
    context.fillStyle = COLORS.card;
    roundedRect(context, 60, y, 960, cardHeight, 28);

    context.fillStyle = COLORS.muted;
    context.font = '600 24px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText(String(index + 1).padStart(2, "0"), 90, y + 49);

    context.fillStyle = COLORS.ink;
    context.font = '600 34px "PingFang SC", "Microsoft YaHei", sans-serif';
    const titleLines = wrapText(context, entry.title, 580, 1);
    context.fillText(titleLines[0] ?? "", 142, y + 52);

    if (entry.flow) {
      context.fillStyle = COLORS.gold;
      roundedRect(context, 850, y + 25, 120, 44, 22);
      context.fillStyle = "#fff";
      context.font = '600 22px "PingFang SC", "Microsoft YaHei", sans-serif';
      context.fillText("心流", 886, y + 55);
    }

    if (entry.detail) {
      context.fillStyle = COLORS.muted;
      context.font = '400 25px "PingFang SC", "Microsoft YaHei", sans-serif';
      const detailLines = wrapText(context, entry.detail, 800, 1);
      context.fillText(detailLines[0] ?? "", 142, y + 92);
    }

    const meterY = y + cardHeight - 38;
    context.fillStyle = COLORS.muted;
    context.font = '500 20px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText("投入", 142, meterY + 6);
    drawMeter(context, 200, meterY - 5, 245, entry.engagement, 0, 10, COLORS.green);
    context.fillText("能量", 500, meterY + 6);
    drawMeter(context, 558, meterY - 5, 245, entry.energy, -5, 5, entry.energy < 0 ? COLORS.coral : COLORS.gold);
    context.fillStyle = COLORS.ink;
    context.font = '600 20px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText(`${entry.engagement}/10`, 455, meterY + 6);
    context.fillText(entry.energy > 0 ? `+${entry.energy}` : String(entry.energy), 813, meterY + 6);

    y += cardHeight + 20;
  });

  if (!entries.length) {
    context.fillStyle = COLORS.card;
    roundedRect(context, 60, 250, 960, 330, 32);
    context.fillStyle = COLORS.muted;
    context.font = '400 34px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.textAlign = "center";
    context.fillText("今天还没有记录", 540, 405);
    context.textAlign = "start";
  }

  context.fillStyle = COLORS.muted;
  context.font = '400 22px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.fillText("留意投入与能量，找到属于自己的方向", 72, 1378);
  context.textAlign = "right";
  context.fillText("GOOD TIMES", 1008, 1378);
  context.textAlign = "start";

  return canvas;
}

export async function shareDailyImage(date: string, entries: ActivityEntry[]) {
  const canvas = makeDailyCanvas(date, entries);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("无法生成分享图片"));
    }, "image/png");
  });
  const file = new File([blob], `美好时光-${date}.png`, { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: "美好时光日志",
      text: formatDate(date),
      files: [file],
    });
    return "shared" as const;
  }

  downloadBlob(blob, file.name);
  return "downloaded" as const;
}
