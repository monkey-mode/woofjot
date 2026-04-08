"use client";

export interface DonutSegment {
  pct: number;   // raw value — normalized internally
  color: string;
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(cx: number, cy: number, r: number, sDeg: number, eDeg: number): string {
  const [sx, sy] = polar(cx, cy, r, sDeg);
  const [ex, ey] = polar(cx, cy, r, eDeg);
  const large = eDeg - sDeg > 180 ? 1 : 0;
  return `M${sx.toFixed(3)},${sy.toFixed(3)} A${r},${r},0,${large},1,${ex.toFixed(3)},${ey.toFixed(3)}`;
}

interface Props {
  segments: DonutSegment[];
}

export default function DonutChart({ segments }: Props) {
  const CX = 60, CY = 60, R = 46, SW = 13, GAP = 4;

  const total = segments.reduce((s, x) => s + x.pct, 0);
  if (total === 0) {
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1E2D45" strokeWidth={SW} />
      </svg>
    );
  }

  let cum = 0;
  const arcs = segments
    .filter(s => s.pct / total > 0.015)
    .map(seg => {
      const span = (seg.pct / total) * 360;
      const s = cum + GAP / 2;
      const e = cum + span - GAP / 2;
      cum += span;
      return { color: seg.color, s, e: Math.max(s + 1, e) };
    });

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1E2D45" strokeWidth={SW} />
      {arcs.map((a, i) => (
        <path
          key={i}
          d={arcPath(CX, CY, R, a.s, a.e)}
          fill="none"
          stroke={a.color}
          strokeWidth={SW}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
