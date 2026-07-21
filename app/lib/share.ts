import { entryDayOffset, entryTimeLabel, formatDate } from "./date";
import { ActivityEntry, BackupFile } from "./types";

export type ShareStyle = "simple" | "gauges";

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

type ShareEntryLayout = {
  cardHeight: number;
  titleLines: string[];
  detailLines: string[];
  gaugeCenterY: number;
};

function measureEntryLayout(
  context: CanvasRenderingContext2D,
  entry: ActivityEntry,
  style: ShareStyle,
  showFullContent: boolean,
): ShareEntryLayout {
  const dayOffset = entryDayOffset(entry.dayOffset, entry.date, entry.createdAt);
  const fullContent = showFullContent && !entry.hidden;
  const maxLines = fullContent ? Number.POSITIVE_INFINITY : 1;

  context.font = '600 34px "PingFang SC", "Microsoft YaHei", sans-serif';
  const titleLines = wrapText(context, entry.title, dayOffset === 1 ? 480 : 540, maxLines);

  context.font = `${style === "simple" ? "400 25px" : "400 23px"} "PingFang SC", "Microsoft YaHei", sans-serif`;
  const detailLines = entry.detail
    ? wrapText(context, entry.detail, dayOffset === 1 ? (style === "simple" ? 700 : 660) : (style === "simple" ? 760 : 720), maxLines)
    : [];

  if (style === "simple") {
    const extraHeight = fullContent
      ? Math.max(0, titleLines.length - 1) * 42 + Math.max(0, detailLines.length - 1) * 34
      : 0;
    return {
      cardHeight: (entry.detail ? 178 : 144) + extraHeight,
      titleLines,
      detailLines,
      gaugeCenterY: 0,
    };
  }

  const extraHeight = fullContent
    ? Math.max(0, titleLines.length - 1) * 42 + Math.max(0, detailLines.length - 1) * 32
    : 0;
  return {
    cardHeight: 260 + extraHeight,
    titleLines,
    detailLines,
    gaugeCenterY: 205 + extraHeight,
  };
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

function drawGauge(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  value: number,
  min: number,
  max: number,
  kind: "engagement" | "energy",
) {
  const progress = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const start = Math.PI;
  const end = Math.PI * 2;
  const needleAngle = start + progress * Math.PI;

  context.lineCap = "round";
  context.lineWidth = 14;
  context.strokeStyle = COLORS.line;
  context.beginPath();
  context.arc(centerX, centerY, radius, start, end);
  context.stroke();

  if (kind === "energy") {
    context.globalAlpha = 0.34;
    context.strokeStyle = COLORS.coral;
    context.beginPath();
    context.arc(centerX, centerY, radius, start, Math.PI * 1.5);
    context.stroke();
    context.strokeStyle = COLORS.gold;
    context.beginPath();
    context.arc(centerX, centerY, radius, Math.PI * 1.5, end);
    context.stroke();
    context.globalAlpha = 1;
  } else {
    context.globalAlpha = 0.4;
    context.strokeStyle = COLORS.green;
    context.beginPath();
    context.arc(centerX, centerY, radius, start, end);
    context.stroke();
    context.globalAlpha = 1;
  }

  context.lineWidth = 5;
  context.strokeStyle = COLORS.ink;
  context.beginPath();
  context.moveTo(centerX, centerY);
  context.lineTo(
    centerX + Math.cos(needleAngle) * radius * 0.76,
    centerY + Math.sin(needleAngle) * radius * 0.76,
  );
  context.stroke();

  context.fillStyle = COLORS.ink;
  context.beginPath();
  context.arc(centerX, centerY, 10, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = COLORS.card;
  context.beginPath();
  context.arc(centerX, centerY, 4, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = COLORS.muted;
  context.font = '500 18px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.textAlign = "center";
  context.fillText(kind === "energy" ? "负" : "低", centerX - radius - 4, centerY + 28);
  context.fillText(kind === "energy" ? "正" : "高", centerX + radius + 4, centerY + 28);
  if (kind === "energy") context.fillText("0", centerX, centerY - radius - 17);
  context.fillStyle = COLORS.ink;
  context.font = '600 22px "PingFang SC", "Microsoft YaHei", sans-serif';
  const displayValue = kind === "energy" && value > 0 ? `+${value}` : String(value);
  context.fillText(`${kind === "energy" ? "能量" : "投入"} ${displayValue}`, centerX, centerY + 39);
  context.textAlign = "start";
}

function drawHeader(
  context: CanvasRenderingContext2D,
  date: string,
  nickname: string,
) {
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
  context.fillStyle = COLORS.green;
  context.font = '600 25px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.fillText(`记录者 · ${Array.from(nickname).slice(0, 20).join("")}`, 76, 207);
}

function drawFooter(
  context: CanvasRenderingContext2D,
  nickname: string,
  canvasHeight: number,
) {
  context.fillStyle = COLORS.muted;
  context.font = '400 22px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.fillText("留意投入与能量，找到属于自己的方向", 72, canvasHeight - 36);
  context.textAlign = "right";
  context.fillText(`${nickname} · GOOD TIMES`, 1008, canvasHeight - 36);
  context.textAlign = "start";
}

function drawHiddenExportCard(
  context: CanvasRenderingContext2D,
  y: number,
  cardHeight: number,
  style: ShareStyle,
) {
  context.save();
  context.beginPath();
  context.roundRect(60, y, 960, cardHeight, 28);
  context.clip();

  const frost = context.createLinearGradient(60, y, 1020, y + cardHeight);
  frost.addColorStop(0, "rgba(237, 231, 220, .97)");
  frost.addColorStop(0.48, "rgba(225, 232, 220, .96)");
  frost.addColorStop(1, "rgba(241, 225, 214, .97)");
  context.fillStyle = frost;
  roundedRect(context, 60, y, 960, cardHeight, 28);

  context.globalAlpha = 0.38;
  context.shadowColor = "rgba(87, 78, 64, .28)";
  context.shadowBlur = 28;
  context.fillStyle = "rgba(118, 110, 97, .38)";
  roundedRect(context, 116, y + 34, 150, 24, 12);
  roundedRect(context, 292, y + 30, 430, 34, 17);
  if (cardHeight > 150) {
    roundedRect(context, 154, y + 82, 610, 22, 11);
  }

  if (style === "gauges") {
    context.fillStyle = "rgba(97, 116, 90, .24)";
    context.beginPath();
    context.arc(340, y + 205, 70, Math.PI, Math.PI * 2);
    context.lineWidth = 20;
    context.strokeStyle = "rgba(97, 116, 90, .32)";
    context.stroke();
    context.beginPath();
    context.arc(740, y + 205, 70, Math.PI, Math.PI * 2);
    context.strokeStyle = "rgba(210, 168, 74, .32)";
    context.stroke();
  } else {
    context.fillStyle = "rgba(97, 116, 90, .25)";
    roundedRect(context, 160, y + cardHeight - 44, 285, 15, 8);
    context.fillStyle = "rgba(210, 168, 74, .25)";
    roundedRect(context, 558, y + cardHeight - 44, 285, 15, 8);
  }

  context.restore();

  const veil = context.createLinearGradient(390, y, 690, y + cardHeight);
  veil.addColorStop(0, "rgba(255, 253, 248, .16)");
  veil.addColorStop(0.5, "rgba(255, 253, 248, .52)");
  veil.addColorStop(1, "rgba(255, 253, 248, .16)");
  context.fillStyle = veil;
  roundedRect(context, 60, y, 960, cardHeight, 28);

  context.fillStyle = "rgba(97, 116, 90, .88)";
  roundedRect(context, 438, y + cardHeight / 2 - 24, 204, 48, 24);
  context.fillStyle = "#fff";
  context.font = '600 22px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.textAlign = "center";
  context.fillText("此条记录已隐藏", 540, y + cardHeight / 2 + 8);
  context.textAlign = "start";
}

function drawSimpleEntries(
  context: CanvasRenderingContext2D,
  entries: ActivityEntry[],
  layouts: ShareEntryLayout[],
) {
  let y = 250;

  entries.forEach((entry, index) => {
    const layout = layouts[index];
    const cardHeight = layout.cardHeight;
    context.fillStyle = COLORS.card;
    roundedRect(context, 60, y, 960, cardHeight, 28);
    if (entry.hidden) {
      drawHiddenExportCard(context, y, cardHeight, "simple");
      y += cardHeight + 20;
      return;
    }

    const dayOffset = entryDayOffset(entry.dayOffset, entry.date, entry.createdAt);
    const timeLabel = entryTimeLabel(dayOffset, entry.time, entry.createdAt);
    const titleX = dayOffset === 1 ? 244 : 184;
    context.fillStyle = COLORS.muted;
    context.font = '600 24px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText(timeLabel, 88, y + 49);

    context.fillStyle = COLORS.ink;
    context.font = '600 34px "PingFang SC", "Microsoft YaHei", sans-serif';
    layout.titleLines.forEach((line, lineIndex) => {
      context.fillText(line, titleX, y + 52 + lineIndex * 42);
    });

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
      const detailY = y + 92 + Math.max(0, layout.titleLines.length - 1) * 42;
      layout.detailLines.forEach((line, lineIndex) => {
        context.fillText(line, titleX, detailY + lineIndex * 34);
      });
    }

    const meterY = y + cardHeight - 38;
    const meterWidth = 245;
    context.fillStyle = COLORS.muted;
    context.font = '500 20px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText("投入", 142, meterY + 6);
    drawMeter(context, 200, meterY - 5, meterWidth, entry.engagement, 0, 10, COLORS.green);
    context.fillText("能量", 545, meterY + 6);
    drawMeter(
      context,
      603,
      meterY - 5,
      meterWidth,
      entry.energy,
      -5,
      5,
      entry.energy < 0 ? COLORS.coral : COLORS.gold,
    );
    context.fillStyle = COLORS.ink;
    context.font = '600 20px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.textAlign = "right";
    context.fillText(`${entry.engagement}/10`, 515, meterY + 6);
    context.fillText(entry.energy > 0 ? `+${entry.energy}` : String(entry.energy), 900, meterY + 6);
    context.textAlign = "start";
    y += cardHeight + 20;
  });

  return y;
}

function drawGaugeEntries(
  context: CanvasRenderingContext2D,
  entries: ActivityEntry[],
  layouts: ShareEntryLayout[],
) {
  let y = 250;

  entries.forEach((entry, index) => {
    const layout = layouts[index];
    const cardHeight = layout.cardHeight;
    context.fillStyle = COLORS.card;
    roundedRect(context, 60, y, 960, cardHeight, 28);
    if (entry.hidden) {
      drawHiddenExportCard(context, y, cardHeight, "gauges");
      y += cardHeight + 20;
      return;
    }
    const dayOffset = entryDayOffset(entry.dayOffset, entry.date, entry.createdAt);
    const timeLabel = entryTimeLabel(dayOffset, entry.time, entry.createdAt);
    const titleX = dayOffset === 1 ? 244 : 184;
    context.fillStyle = COLORS.muted;
    context.font = '600 24px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText(timeLabel, 88, y + 49);
    context.fillStyle = COLORS.ink;
    context.font = '600 34px "PingFang SC", "Microsoft YaHei", sans-serif';
    layout.titleLines.forEach((line, lineIndex) => {
      context.fillText(line, titleX, y + 52 + lineIndex * 42);
    });

    if (entry.flow) {
      context.fillStyle = COLORS.gold;
      roundedRect(context, 850, y + 25, 120, 44, 22);
      context.fillStyle = "#fff";
      context.font = '600 22px "PingFang SC", "Microsoft YaHei", sans-serif';
      context.fillText("心流", 886, y + 55);
    }

    if (entry.detail) {
      context.fillStyle = COLORS.muted;
      context.font = '400 23px "PingFang SC", "Microsoft YaHei", sans-serif';
      const detailY = y + 88 + Math.max(0, layout.titleLines.length - 1) * 42;
      layout.detailLines.forEach((line, lineIndex) => {
        context.fillText(line, titleX, detailY + lineIndex * 32);
      });
    }

    drawGauge(context, 340, y + layout.gaugeCenterY, 74, entry.engagement, 0, 10, "engagement");
    drawGauge(context, 740, y + layout.gaugeCenterY, 74, entry.energy, -5, 5, "energy");
    y += cardHeight + 20;
  });

  return y;
}

function makeDailyCanvas(
  date: string,
  entries: ActivityEntry[],
  nickname: string,
  style: ShareStyle,
  showFullContent: boolean,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  const measuringContext = canvas.getContext("2d");
  if (!measuringContext) throw new Error("无法生成分享图片");
  const layouts = entries.map((entry) => measureEntryLayout(measuringContext, entry, style, showFullContent));
  const contentHeight = entries.length
    ? 250 + layouts.reduce((height, layout) => height + layout.cardHeight + 20, 0)
    : 640;
  canvas.height = Math.max(1500, contentHeight + 110);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法生成分享图片");

  context.fillStyle = COLORS.paper;
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawHeader(context, date, nickname);

  if (entries.length) {
    if (style === "gauges") drawGaugeEntries(context, entries, layouts);
    else drawSimpleEntries(context, entries, layouts);
  } else {
    context.fillStyle = COLORS.card;
    roundedRect(context, 60, 270, 960, 330, 32);
    context.fillStyle = COLORS.muted;
    context.font = '400 34px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.textAlign = "center";
    context.fillText("今天还没有记录", 540, 430);
    context.textAlign = "start";
  }

  drawFooter(context, nickname, canvas.height);
  return canvas;
}

export async function createDailyImage(
  date: string,
  entries: ActivityEntry[],
  nickname: string,
  style: ShareStyle,
  showFullContent = false,
): Promise<Blob> {
  const canvas = makeDailyCanvas(date, entries, nickname, style, showFullContent);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("无法生成分享图片"));
    }, "image/png");
  });
}

export async function shareDailyImage(
  date: string,
  entries: ActivityEntry[],
  nickname: string,
  style: ShareStyle,
  showFullContent = false,
  preparedBlob?: Blob,
) {
  const blob = preparedBlob ?? await createDailyImage(date, entries, nickname, style, showFullContent);
  const file = new File([blob], `美好时光-${nickname}-${date}.png`, { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: `${nickname}的美好时光日志`,
      text: formatDate(date),
      files: [file],
    });
    return "shared" as const;
  }

  downloadBlob(blob, file.name);
  return "downloaded" as const;
}
