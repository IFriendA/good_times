"use client";

import { useRef } from "react";
import Gauge from "./Gauge";
import { SparkleIcon } from "./Icons";

export type ActivityFormValue = {
  id: string | null;
  time: string;
  dayOffset: 0 | 1;
  title: string;
  detail: string;
  engagement: number;
  energy: number;
  flow: boolean;
};

type Props = {
  value: ActivityFormValue;
  onChange: (patch: Partial<ActivityFormValue>) => void;
  fieldPrefix: string;
};

export default function ActivityFields({ value, onChange, fieldPrefix }: Props) {
  const timeInputRef = useRef<HTMLInputElement>(null);
  const timeId = `${fieldPrefix}-time`;
  const titleId = `${fieldPrefix}-title`;
  const detailId = `${fieldPrefix}-detail`;

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

  return (
    <>
      <label className="field-label" htmlFor={timeId}>时间</label>
      <div className="time-editor-row">
        <div className="day-offset-control" aria-label="活动发生日期">
          <button
            type="button"
            className={value.dayOffset === 0 ? "active" : ""}
            onClick={() => onChange({ dayOffset: 0 })}
          >
            当天
          </button>
          <button
            type="button"
            className={value.dayOffset === 1 ? "active" : ""}
            onClick={() => onChange({ dayOffset: 1 })}
          >
            次日
          </button>
        </div>
        <label className="time-field" htmlFor={timeId} onClick={openTimePicker}>
          <input
            ref={timeInputRef}
            id={timeId}
            type="time"
            value={value.time}
            onChange={(event) => onChange({ time: event.target.value })}
            required
          />
          <span>发生时间</span>
        </label>
      </div>

      <label className="field-label" htmlFor={titleId}>活动</label>
      <input
        id={titleId}
        className="text-input text-input--large"
        value={value.title}
        onChange={(event) => onChange({ title: event.target.value })}
        placeholder="例如：和同事讨论新方案"
        maxLength={40}
        required
      />

      <label className="field-label" htmlFor={detailId}>发生了什么？（选填）</label>
      <textarea
        id={detailId}
        className="text-input"
        value={value.detail}
        onChange={(event) => onChange({ detail: event.target.value })}
        placeholder="尽量具体：和谁、在哪里、哪一部分让你有感觉……"
        maxLength={160}
        rows={3}
      />

      <div className="gauge-grid">
        <Gauge
          kind="engagement"
          value={value.engagement}
          onChange={(engagement) => onChange({ engagement })}
        />
        <Gauge
          kind="energy"
          value={value.energy}
          onChange={(energy) => onChange({ energy })}
        />
      </div>

      <label className={`flow-toggle ${value.flow ? "flow-toggle--active" : ""}`}>
        <input
          type="checkbox"
          checked={value.flow}
          onChange={(event) => onChange({ flow: event.target.checked })}
        />
        <span className="flow-toggle__icon"><SparkleIcon /></span>
        <span>
          <strong>这是一次心流体验</strong>
          <small>全神贯注，几乎忘记了时间</small>
        </span>
        <span className="flow-toggle__check">✓</span>
      </label>
    </>
  );
}
