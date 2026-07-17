"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Gauge from "./components/Gauge";
import {
  ChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  EditIcon,
  JournalIcon,
  PlusIcon,
  SettingsIcon,
  ShareIcon,
  SparkleIcon,
  TrashIcon,
  UploadIcon,
} from "./components/Icons";
import { currentTimeKey, entryTime, formatDate, shiftDate, shortDate, todayKey } from "./lib/date";
import { clearEntries, deleteEntry, getEntries, saveEntries, saveEntry } from "./lib/storage";
import { createDailyImage, exportBackup, shareDailyImage, ShareStyle } from "./lib/share";
import { ActivityEntry, isActivityEntry } from "./lib/types";

type Tab = "journal" | "review" | "settings";
type ReviewRange = "7" | "30" | "all";
type SortOrder = "asc" | "desc";

type FormState = {
  id: string | null;
  time: string;
  title: string;
  detail: string;
  engagement: number;
  energy: number;
  flow: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  time: "",
  title: "",
  detail: "",
  engagement: 5,
  energy: 0,
  flow: false,
};

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function energyText(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function makeActivityGroups(entries: ActivityEntry[]) {
  const groups = new Map<
    string,
    { title: string; count: number; engagement: number[]; energy: number[]; flow: number }
  >();

  entries.forEach((entry) => {
    const key = entry.title.trim().toLocaleLowerCase("zh-CN");
    const group = groups.get(key) ?? {
      title: entry.title.trim(),
      count: 0,
      engagement: [],
      energy: [],
      flow: 0,
    };
    group.count += 1;
    group.engagement.push(entry.engagement);
    group.energy.push(entry.energy);
    if (entry.flow) group.flow += 1;
    groups.set(key, group);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    averageEngagement: average(group.engagement),
    averageEnergy: average(group.energy),
  }));
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("journal");
  const [selectedDate, setSelectedDate] = useState("");
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewRange, setReviewRange] = useState<ReviewRange>("7");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [toast, setToast] = useState("");
  const [nickname, setNickname] = useState("");
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [nicknameEditing, setNicknameEditing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareStyle, setShareStyle] = useState<ShareStyle>("simple");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const previewBlobRef = useRef<Blob | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSelectedDate(todayKey());
    const savedNickname = window.localStorage.getItem("good-times-nickname") ?? "";
    const savedSortOrder = window.localStorage.getItem("good-times-sort-order");
    setNickname(savedNickname);
    setNicknameDraft(savedNickname);
    if (savedSortOrder === "asc" || savedSortOrder === "desc") setSortOrder(savedSortOrder);
    getEntries()
      .then(setEntries)
      .catch(() => setToast("读取本地记录失败，请刷新后重试"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 2600);
  }

  const dayEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.date === selectedDate)
        .sort((a, b) => {
          const timeComparison = entryTime(a.time, a.createdAt).localeCompare(entryTime(b.time, b.createdAt));
          const stableComparison = timeComparison || a.createdAt.localeCompare(b.createdAt);
          return sortOrder === "asc" ? stableComparison : -stableComparison;
        }),
    [entries, selectedDate, sortOrder],
  );

  useEffect(() => {
    if (!shareOpen || !nickname || nicknameEditing || !selectedDate) {
      setPreviewUrl("");
      return;
    }

    let active = true;
    let objectUrl = "";
    previewBlobRef.current = null;
    setPreviewLoading(true);
    setPreviewUrl("");
    createDailyImage(selectedDate, dayEntries, nickname, shareStyle)
      .then((blob) => {
        if (!active) return;
        previewBlobRef.current = blob;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (active) showToast("预览生成失败，请稍后重试");
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });

    return () => {
      active = false;
      previewBlobRef.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [shareOpen, nickname, nicknameEditing, selectedDate, dayEntries, shareStyle]);

  const reviewEntries = useMemo(() => {
    if (reviewRange === "all") return entries;
    const cutoff = shiftDate(todayKey(), -(Number(reviewRange) - 1));
    return entries.filter((entry) => entry.date >= cutoff);
  }, [entries, reviewRange]);

  const activityGroups = useMemo(() => makeActivityGroups(reviewEntries), [reviewEntries]);
  const averageEngagement = average(reviewEntries.map((entry) => entry.engagement));
  const averageEnergy = average(reviewEntries.map((entry) => entry.energy));
  const flowCount = reviewEntries.filter((entry) => entry.flow).length;
  const energizingActivities = [...activityGroups]
    .filter((group) => group.averageEnergy > 0)
    .sort((a, b) => b.averageEnergy - a.averageEnergy)
    .slice(0, 3);
  const drainingActivities = [...activityGroups]
    .filter((group) => group.averageEnergy < 0)
    .sort((a, b) => a.averageEnergy - b.averageEnergy)
    .slice(0, 3);
  const engagingActivities = [...activityGroups]
    .sort((a, b) => b.averageEngagement - a.averageEngagement)
    .slice(0, 3);

  const lastSevenDays = useMemo(() => {
    const today = todayKey();
    return Array.from({ length: 7 }, (_, index) => shiftDate(today, index - 6)).map((date) => {
      const dateEntries = entries.filter((entry) => entry.date === date);
      return {
        date,
        count: dateEntries.length,
        energy: average(dateEntries.map((entry) => entry.energy)),
      };
    });
  }, [entries]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormOpen(false);
  }

  function openNewEntry() {
    setForm({ ...EMPTY_FORM, time: currentTimeKey() });
    setFormOpen(true);
    window.setTimeout(() => {
      document.querySelector<HTMLInputElement>("#activity-title")?.focus();
    }, 50);
  }

  function editActivity(entry: ActivityEntry) {
    setForm({
      id: entry.id,
      time: entryTime(entry.time, entry.createdAt),
      title: entry.title,
      detail: entry.detail,
      engagement: entry.engagement,
      energy: entry.energy,
      flow: entry.flow,
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title || !selectedDate) return;

    const existing = form.id ? entries.find((entry) => entry.id === form.id) : undefined;
    const now = new Date().toISOString();
    const entry: ActivityEntry = {
      id: existing?.id ?? crypto.randomUUID(),
      date: selectedDate,
      time: form.time || currentTimeKey(),
      title,
      detail: form.detail.trim(),
      engagement: form.engagement,
      energy: form.energy,
      flow: form.flow,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    try {
      await saveEntry(entry);
      setEntries((current) => {
        const others = current.filter((item) => item.id !== entry.id);
        return [entry, ...others];
      });
      resetForm();
      showToast(existing ? "记录已更新" : "这一刻已经收好");
    } catch {
      showToast("保存失败，请稍后重试");
    }
  }

  async function handleDelete(entry: ActivityEntry) {
    if (!window.confirm(`删除“${entry.title}”这条记录吗？`)) return;
    try {
      await deleteEntry(entry.id);
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      if (form.id === entry.id) resetForm();
      showToast("记录已删除");
    } catch {
      showToast("删除失败，请稍后重试");
    }
  }

  function openShare() {
    setNicknameDraft(nickname);
    setNicknameEditing(!nickname);
    setShareOpen(true);
  }

  function saveNicknameForSharing(event: FormEvent) {
    event.preventDefault();
    const cleaned = nicknameDraft.trim();
    if (!cleaned) return;
    window.localStorage.setItem("good-times-nickname", cleaned);
    setNickname(cleaned);
    setNicknameDraft(cleaned);
    setNicknameEditing(false);
  }

  async function handleShare() {
    try {
      const result = await shareDailyImage(
        selectedDate,
        dayEntries,
        nickname,
        shareStyle,
        previewBlobRef.current ?? undefined,
      );
      showToast(result === "shared" ? "分享面板已打开" : "分享图片已保存");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showToast("生成图片失败，请稍后重试");
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!parsed || typeof parsed !== "object") throw new Error("invalid");
      const candidate = parsed as { app?: string; entries?: unknown };
      if (candidate.app !== "good-times-journal" || !Array.isArray(candidate.entries)) {
        throw new Error("invalid");
      }
      const importedEntries = candidate.entries.filter(isActivityEntry);
      if (importedEntries.length !== candidate.entries.length) throw new Error("invalid");

      await saveEntries(importedEntries);
      setEntries(await getEntries());
      showToast(`已恢复 ${importedEntries.length} 条记录`);
    } catch {
      showToast("这不是有效的美好时光日志备份");
    }
  }

  async function handleClearAll() {
    if (!entries.length) return;
    if (!window.confirm("确定清空全部本地记录吗？此操作无法撤销，请先导出备份。")) return;
    await clearEntries();
    setEntries([]);
    resetForm();
    showToast("全部记录已清空");
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setFormOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeSortOrder(order: SortOrder) {
    setSortOrder(order);
    window.localStorage.setItem("good-times-sort-order", order);
  }

  function openTimePicker() {
    const input = timeInputRef.current;
    if (!input) return;
    input.focus();
    try {
      input.showPicker?.();
    } catch {
      // 不支持 showPicker 的浏览器仍会通过 label 的默认行为聚焦输入框。
    }
  }

  if (!selectedDate) {
    return <main className="app-shell app-shell--loading">正在翻开日志…</main>;
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <p className="eyebrow">GOOD TIMES</p>
          <h1>美好时光日志</h1>
        </div>
        {activeTab === "journal" && (
          <button className="header-action" type="button" onClick={openShare} aria-label="分享当天记录">
            <ShareIcon />
          </button>
        )}
      </header>

      {activeTab === "journal" && (
        <section className="page-section page-section--journal">
          <div className="date-navigator">
            <button
              className="date-navigator__arrow"
              type="button"
              onClick={() => setSelectedDate((date) => shiftDate(date, -1))}
              aria-label="前一天"
            >
              <ChevronLeftIcon />
            </button>
            <label className="date-navigator__center">
              <span>{selectedDate === todayKey() ? "今天" : "日志日期"}</span>
              <strong>{formatDate(selectedDate)}</strong>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                aria-label="选择日志日期"
              />
            </label>
            <button
              className="date-navigator__arrow"
              type="button"
              onClick={() => setSelectedDate((date) => shiftDate(date, 1))}
              aria-label="后一天"
            >
              <ChevronRightIcon />
            </button>
          </div>

          {formOpen ? (
            <form className="entry-form paper-card" onSubmit={handleSave}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{form.id ? "EDIT MOMENT" : "CAPTURE A MOMENT"}</p>
                  <h2>{form.id ? "修改这段时光" : "刚刚在做什么？"}</h2>
                </div>
                <button className="text-button" type="button" onClick={resetForm}>取消</button>
              </div>

              <label className="field-label" htmlFor="activity-time">时间</label>
              <label className="time-field" htmlFor="activity-time" onClick={openTimePicker}>
                <input
                  ref={timeInputRef}
                  id="activity-time"
                  type="time"
                  value={form.time}
                  onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                  required
                />
                <span>这项活动发生在什么时候</span>
              </label>

              <label className="field-label" htmlFor="activity-title">活动</label>
              <input
                id="activity-title"
                className="text-input text-input--large"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="例如：和同事讨论新方案"
                maxLength={40}
                required
              />

              <label className="field-label" htmlFor="activity-detail">发生了什么？（选填）</label>
              <textarea
                id="activity-detail"
                className="text-input"
                value={form.detail}
                onChange={(event) => setForm((current) => ({ ...current, detail: event.target.value }))}
                placeholder="尽量具体：和谁、在哪里、哪一部分让你有感觉……"
                maxLength={160}
                rows={3}
              />

              <div className="gauge-grid">
                <Gauge
                  kind="engagement"
                  value={form.engagement}
                  onChange={(engagement) => setForm((current) => ({ ...current, engagement }))}
                />
                <Gauge
                  kind="energy"
                  value={form.energy}
                  onChange={(energy) => setForm((current) => ({ ...current, energy }))}
                />
              </div>

              <label className={`flow-toggle ${form.flow ? "flow-toggle--active" : ""}`}>
                <input
                  type="checkbox"
                  checked={form.flow}
                  onChange={(event) => setForm((current) => ({ ...current, flow: event.target.checked }))}
                />
                <span className="flow-toggle__icon"><SparkleIcon /></span>
                <span>
                  <strong>这是一次心流体验</strong>
                  <small>全神贯注，几乎忘记了时间</small>
                </span>
                <span className="flow-toggle__check">✓</span>
              </label>

              <button className="primary-button" type="submit">
                {form.id ? "保存修改" : "保存这段时光"}
              </button>
            </form>
          ) : (
            <button className="add-moment-card" type="button" onClick={openNewEntry}>
              <span className="add-moment-card__icon"><PlusIcon size={26} /></span>
              <span>
                <strong>记录此刻</strong>
                <small>捕捉投入与能量的线索</small>
              </span>
            </button>
          )}

          <div className="entries-heading">
            <div>
              <h2>当天活动</h2>
              <span>{dayEntries.length} 条记录</span>
            </div>
            <div className="sort-control" aria-label="记录排列顺序">
              <button
                type="button"
                className={sortOrder === "asc" ? "active" : ""}
                onClick={() => changeSortOrder("asc")}
                aria-label="按时间从早到晚排列"
              >
                早 → 晚
              </button>
              <button
                type="button"
                className={sortOrder === "desc" ? "active" : ""}
                onClick={() => changeSortOrder("desc")}
                aria-label="按时间从晚到早排列"
              >
                晚 → 早
              </button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">正在读取本地记录…</div>
          ) : dayEntries.length ? (
            <div className="entry-list">
              {dayEntries.map((entry) => (
                <article className="entry-card paper-card" key={entry.id}>
                  <div className="entry-card__top">
                    <div>
                      <div className="entry-card__title-row">
                        <time dateTime={`${entry.date}T${entryTime(entry.time, entry.createdAt)}`}>
                          {entryTime(entry.time, entry.createdAt)}
                        </time>
                        <h3>{entry.title}</h3>
                      </div>
                      {entry.detail && <p>{entry.detail}</p>}
                    </div>
                    {entry.flow && <span className="flow-badge"><SparkleIcon size={15} /> 心流</span>}
                  </div>
                  <div className="entry-card__gauges">
                    <Gauge kind="engagement" value={entry.engagement} compact />
                    <Gauge kind="energy" value={entry.energy} compact />
                  </div>
                  <div className="entry-card__actions">
                    <button type="button" onClick={() => editActivity(entry)}><EditIcon size={17} /> 编辑</button>
                    <button type="button" onClick={() => handleDelete(entry)}><TrashIcon size={17} /> 删除</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state paper-card">
              <span className="empty-state__sun" aria-hidden="true">☀</span>
              <h3>今天的线索还在等你</h3>
              <p>不必等到“特别美好”，任何让你投入或消耗能量的活动都值得记录。</p>
              <button type="button" className="secondary-button" onClick={openNewEntry}>写下第一条</button>
            </div>
          )}
        </section>
      )}

      {activeTab === "review" && (
        <section className="page-section">
          <div className="review-hero">
            <p className="eyebrow">LOOK BACK, MOVE FORWARD</p>
            <h2>回顾你的能量轨迹</h2>
            <p>不急着下结论，先看看反复出现的线索。</p>
          </div>

          <div className="segmented-control" aria-label="回顾时间范围">
            {(["7", "30", "all"] as ReviewRange[]).map((range) => (
              <button
                type="button"
                key={range}
                className={reviewRange === range ? "active" : ""}
                onClick={() => setReviewRange(range)}
              >
                {range === "7" ? "近 7 天" : range === "30" ? "近 30 天" : "全部"}
              </button>
            ))}
          </div>

          {!reviewEntries.length ? (
            <div className="empty-state paper-card review-empty">
              <SparkleIcon size={34} />
              <h3>记录积累后，模式会在这里出现</h3>
              <p>连续记录几天，你会看到哪些活动带来投入、能量和心流。</p>
              <button type="button" className="secondary-button" onClick={() => switchTab("journal")}>去记录</button>
            </div>
          ) : (
            <>
              <div className="metric-grid">
                <div className="metric-card">
                  <span>平均投入</span>
                  <strong>{averageEngagement.toFixed(1)}</strong>
                  <small>/ 10</small>
                </div>
                <div className="metric-card">
                  <span>平均能量</span>
                  <strong>{averageEnergy > 0 ? "+" : ""}{averageEnergy.toFixed(1)}</strong>
                  <small>/ ±5</small>
                </div>
                <div className="metric-card metric-card--accent">
                  <span>心流时刻</span>
                  <strong>{flowCount}</strong>
                  <small>次</small>
                </div>
              </div>

              <div className="paper-card chart-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">ENERGY RHYTHM</p>
                    <h3>最近七天</h3>
                  </div>
                  <span className="legend-dot">平均能量</span>
                </div>
                <div className="energy-chart">
                  <div className="energy-chart__zero" />
                  {lastSevenDays.map((day) => {
                    const normalized = day.count ? (day.energy + 5) / 10 : 0.5;
                    const top = day.energy >= 0 ? 50 - Math.abs(day.energy) * 8 : 50;
                    const height = day.count ? Math.max(5, Math.abs(normalized - 0.5) * 80) : 3;
                    return (
                      <div className="energy-chart__day" key={day.date}>
                        <div className="energy-chart__bar-area">
                          <span
                            className={`energy-chart__bar ${day.energy < 0 ? "negative" : "positive"} ${!day.count ? "empty" : ""}`}
                            style={{ top: `${top}%`, height: `${height}%` }}
                            title={`${formatDate(day.date)}：${day.count ? energyText(Number(day.energy.toFixed(1))) : "无记录"}`}
                          />
                        </div>
                        <small>{shortDate(day.date)}</small>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="insight-card insight-card--green">
                <span className="insight-card__icon">↗</span>
                <div>
                  <p className="eyebrow">为你充能</p>
                  <h3>{energizingActivities[0]?.title ?? "暂未发现明显模式"}</h3>
                  <p>
                    {energizingActivities.length
                      ? `平均能量 ${energyText(Number(energizingActivities[0].averageEnergy.toFixed(1)))}，出现 ${energizingActivities[0].count} 次。可以考虑主动为它留出更多空间。`
                      : "继续记录具体活动，正能量来源会逐渐浮现。"}
                  </p>
                </div>
              </div>

              <div className="insight-card insight-card--gold">
                <span className="insight-card__icon"><SparkleIcon /></span>
                <div>
                  <p className="eyebrow">最容易投入</p>
                  <h3>{engagingActivities[0]?.title}</h3>
                  <p>平均投入 {engagingActivities[0]?.averageEngagement.toFixed(1)} / 10。回想一下：是活动、环境、互动、物体还是参与的人让你投入？</p>
                </div>
              </div>

              {drainingActivities.length > 0 && (
                <div className="insight-card insight-card--coral">
                  <span className="insight-card__icon">↘</span>
                  <div>
                    <p className="eyebrow">需要留意</p>
                    <h3>{drainingActivities[0].title}</h3>
                    <p>平均能量 {drainingActivities[0].averageEnergy.toFixed(1)}。先观察具体原因，不必急着把整类活动全部否定。</p>
                  </div>
                </div>
              )}

            </>
          )}
        </section>
      )}

      {activeTab === "settings" && (
        <section className="page-section">
          <div className="review-hero settings-hero">
            <p className="eyebrow">YOUR DATA, YOUR STORY</p>
            <h2>数据与使用</h2>
            <p>所有日志默认只保存在这台设备的浏览器中。</p>
          </div>

          <div className="paper-card storage-card">
            <div className="storage-card__ring"><strong>{entries.length}</strong><span>条</span></div>
            <div>
              <h3>本地日志</h3>
              <p>无需账号，不会自动上传云端。建议定期导出备份。</p>
            </div>
          </div>

          <div className="settings-group">
            <h3>备份与迁移</h3>
            <button type="button" className="settings-row" onClick={() => exportBackup(entries)} disabled={!entries.length}>
              <span className="settings-row__icon"><DownloadIcon /></span>
              <span><strong>导出数据备份</strong><small>保存为 JSON，可在新设备恢复</small></span>
              <ChevronRightIcon size={18} />
            </button>
            <button type="button" className="settings-row" onClick={() => fileInputRef.current?.click()}>
              <span className="settings-row__icon"><UploadIcon /></span>
              <span><strong>导入数据备份</strong><small>不会覆盖同一条记录，只会更新或合并</small></span>
              <ChevronRightIcon size={18} />
            </button>
            <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
          </div>

          <div className="settings-group danger-zone">
            <h3>危险操作</h3>
            <button type="button" onClick={handleClearAll} disabled={!entries.length}>清空全部本地记录</button>
          </div>

          <footer className="app-footer">
            <div className="brand-mark brand-mark--small"><span /><span /><span /></div>
            <p>美好时光日志 · 从真实体验中寻找方向</p>
            <small>本应用依据《斯坦福大学人生设计课》中的练习理念设计。</small>
          </footer>
        </section>
      )}

      {shareOpen && (
        <div className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
          <button className="share-modal__backdrop" type="button" aria-label="关闭分享预览" onClick={() => setShareOpen(false)} />
          <section className="share-sheet">
            <div className="share-sheet__handle" />
            <div className="share-sheet__header">
              <div>
                <p className="eyebrow">SHARE YOUR DAY</p>
                <h2 id="share-title">分享今日时光</h2>
              </div>
              <button type="button" onClick={() => setShareOpen(false)} aria-label="关闭">×</button>
            </div>

            {nicknameEditing || !nickname ? (
              <form className="nickname-form" onSubmit={saveNicknameForSharing}>
                <div className="nickname-form__mark">你</div>
                <h3>{nickname ? "修改分享昵称" : "第一次分享，怎么称呼你？"}</h3>
                <p>昵称会显示在导出的图片中，并且只保存在这台设备上。</p>
                <label htmlFor="share-nickname">我的昵称</label>
                <input
                  id="share-nickname"
                  className="text-input text-input--large"
                  value={nicknameDraft}
                  onChange={(event) => setNicknameDraft(event.target.value)}
                  placeholder="例如：小美"
                  maxLength={20}
                  autoFocus
                  required
                />
                <button className="primary-button" type="submit">保存并生成预览</button>
                {nickname && (
                  <button className="text-button nickname-form__cancel" type="button" onClick={() => setNicknameEditing(false)}>取消修改</button>
                )}
              </form>
            ) : (
              <>
                <div className="share-profile">
                  <span>记录者 · <strong>{nickname}</strong></span>
                  <button type="button" onClick={() => setNicknameEditing(true)}>修改昵称</button>
                </div>

                <div className="share-style-picker" aria-label="分享图片样式">
                  <button
                    type="button"
                    className={shareStyle === "simple" ? "active" : ""}
                    onClick={() => setShareStyle("simple")}
                  >
                    <span className="style-icon style-icon--simple"><i /><i /><i /></span>
                    <span><strong>简洁清单</strong><small>重点信息一目了然</small></span>
                  </button>
                  <button
                    type="button"
                    className={shareStyle === "gauges" ? "active" : ""}
                    onClick={() => setShareStyle("gauges")}
                  >
                    <span className="style-icon style-icon--gauge"><i /></span>
                    <span><strong>仪表盘</strong><small>保留投入与能量指针</small></span>
                  </button>
                </div>

                <div className="share-preview">
                  {previewLoading && <div className="share-preview__loading">正在生成预览…</div>}
                  {previewUrl && (
                    <Image
                      src={previewUrl}
                      alt={`${nickname}的美好时光日志分享预览`}
                      width={1080}
                      height={1500}
                      unoptimized
                      priority
                    />
                  )}
                </div>

                <button className="primary-button share-final-button" type="button" onClick={handleShare} disabled={!previewUrl || previewLoading}>
                  <ShareIcon size={19} /> 分享或保存图片
                </button>
              </>
            )}
          </section>
        </div>
      )}

      <nav className="bottom-nav" aria-label="主导航">
        <button className={activeTab === "journal" ? "active" : ""} type="button" onClick={() => switchTab("journal")}>
          <JournalIcon /><span>记录</span>
        </button>
        <button className={activeTab === "review" ? "active" : ""} type="button" onClick={() => switchTab("review")}>
          <ChartIcon /><span>回顾</span>
        </button>
        <button className={activeTab === "settings" ? "active" : ""} type="button" onClick={() => switchTab("settings")}>
          <SettingsIcon /><span>设置</span>
        </button>
      </nav>

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
