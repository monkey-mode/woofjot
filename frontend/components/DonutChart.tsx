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
  const CX = 60, CY = 60, R = 46, SW = 13;

  const total = segments.reduce((s, x) => s + x.pct, 0);
  if (total === 0) {
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1E2D45" strokeWidth={SW} />
      </svg>
    );
  }

  // Only keep segments large enough to render, then scale to 360° so
  // the drawn segments always fill the full circle with no gap.
  const drawn = segments.filter(s => s.pct / total > 0.01);
  const drawnTotal = drawn.reduce((s, x) => s + x.pct, 0);
  let cum = 0;
  const arcs = drawn.map(seg => {
    const span = (seg.pct / drawnTotal) * 360;
    const s = cum;
    const e = cum + span;
    cum += span;
    return { color: seg.color, s, e };
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
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}
