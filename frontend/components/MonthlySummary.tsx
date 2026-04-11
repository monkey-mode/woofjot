"use client";

import type { CategorySummary } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import DonutChart, { type DonutSegment } from "./DonutChart";

interface Props {
  summary: CategorySummary[];
  loading?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  food:          "#F5C518",
  transport:     "#22D3EE",
  shopping:      "#F472B6",
  utilities:     "#A78BFA",
  health:        "#4ADE80",
  entertainment: "#FB923C",
  invest:        "#34D399",
  other:         "#475569",
};

const CATEGORY_ICONS: Record<string, string> = {
  food:          "🍜",
  transport:     "🚌",
  shopping:      "🛍️",
  utilities:     "💡",
  health:        "❤️",
  entertainment: "🎮",
  invest:        "📈",
  other:         "📋",
};

export default function MonthlySummary({ summary, loading }: Props) {
  if (loading) {
    return (
      <div className="flex gap-4 items-center animate-pulse">
        <div className="w-28 h-28 shrink-0 rounded-full bg-elevated" />
        <div className="flex-1 space-y-3">
          {[70, 50, 85, 40].map((w, i) => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 bg-elevated rounded-full" style={{ width: `${w}%` }} />
              <div className="h-1 bg-elevated rounded-full w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (summary.length === 0) return null;

  const total = summary.reduce((s, c) => s + c.total, 0);

  const segments: DonutSegment[] = summary.map(({ category, total: amount }) => ({
    pct: amount,
    color: CATEGORY_COLORS[category] ?? "#475569",
  }));

  return (
    <div className="flex gap-4 items-center">
      {/* Donut */}
      <div className="relative w-28 h-28 shrink-0">
        <DonutChart segments={segments} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-accent text-[10px] font-semibold uppercase tracking-wide">รายจ่าย</p>
          <p className="text-white font-black text-sm leading-tight">
            {new Intl.NumberFormat("th-TH", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(total)}
          </p>
          <p className="text-muted text-[10px]">บาท</p>
        </div>
      </div>

      {/* Category list — scrollable when > 4 categories */}
      <div className="flex-1 min-w-0 max-h-[112px] overflow-y-auto space-y-2 pr-1 scrollbar-none">
        {summary.map(({ category, total: amount }) => {
          const pct = total > 0 ? (amount / total) * 100 : 0;
          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm">{CATEGORY_ICONS[category] ?? "📋"}</span>
                  <span className="text-faint text-xs truncate">
                    {CATEGORIES[category as keyof typeof CATEGORIES] ?? category}
                  </span>
                </div>
                <span className="text-white text-xs font-semibold ml-2 shrink-0">
                  {new Intl.NumberFormat("th-TH", {
                    maximumFractionDigits: 0,
                  }).format(amount)}
                </span>
              </div>
              <div className="h-1 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: CATEGORY_COLORS[category] ?? "#475569",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
