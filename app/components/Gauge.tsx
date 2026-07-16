type GaugeProps = {
  kind: "engagement" | "energy";
  value: number;
  onChange?: (value: number) => void;
  compact?: boolean;
};

function valueLabel(kind: GaugeProps["kind"], value: number) {
  if (kind === "engagement") {
    if (value <= 2) return "很低";
    if (value <= 4) return "偏低";
    if (value <= 6) return "一般";
    if (value <= 8) return "投入";
    return "忘我";
  }

  if (value <= -3) return "很耗能";
  if (value < 0) return "有点累";
  if (value === 0) return "平衡";
  if (value <= 2) return "有补充";
  return "很充能";
}

export default function Gauge({ kind, value, onChange, compact }: GaugeProps) {
  const isEnergy = kind === "energy";
  const min = isEnergy ? -5 : 0;
  const max = isEnergy ? 5 : 10;
  const progress = (value - min) / (max - min);
  const angle = -90 + progress * 180;
  const title = isEnergy ? "能量" : "投入";
  const displayValue = isEnergy && value > 0 ? `+${value}` : String(value);

  return (
    <div className={`gauge ${compact ? "gauge--compact" : ""}`}>
      <div className="gauge__heading">
        <span>{title}</span>
        <strong>{displayValue}</strong>
      </div>
      <svg
        className="gauge__dial"
        viewBox="0 0 200 112"
        role="img"
        aria-label={`${title} ${displayValue}，${valueLabel(kind, value)}`}
      >
        <path className="gauge__track" d="M 20 92 A 80 80 0 0 1 180 92" />
        {isEnergy ? (
          <>
            <path
              className="gauge__arc gauge__arc--negative"
              d="M 20 92 A 80 80 0 0 1 100 12"
            />
            <path
              className="gauge__arc gauge__arc--positive"
              d="M 100 12 A 80 80 0 0 1 180 92"
            />
          </>
        ) : (
          <path
            className="gauge__arc gauge__arc--engagement"
            d="M 20 92 A 80 80 0 0 1 180 92"
          />
        )}
        <line
          className="gauge__needle"
          x1="100"
          y1="92"
          x2="100"
          y2="28"
          style={{ transform: `rotate(${angle}deg)` }}
        />
        <circle className="gauge__pin" cx="100" cy="92" r="9" />
        <circle className="gauge__pin-core" cx="100" cy="92" r="3" />
        <text className="gauge__edge-label" x="15" y="108">
          {isEnergy ? "负" : "低"}
        </text>
        <text className="gauge__edge-label" x="177" y="108">
          {isEnergy ? "正" : "高"}
        </text>
        {isEnergy && (
          <text className="gauge__zero-label" x="100" y="10">
            0
          </text>
        )}
      </svg>
      {!compact && onChange && (
        <>
          <input
            className={`gauge__range gauge__range--${kind}`}
            type="range"
            min={min}
            max={max}
            step="1"
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            aria-label={`${title}程度`}
          />
          <div className="gauge__caption">{valueLabel(kind, value)}</div>
        </>
      )}
    </div>
  );
}
