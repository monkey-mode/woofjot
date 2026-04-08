"use client";

import type { Expense } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import DonutChart, { type DonutSegment } from "./DonutChart";

interface Props {
  expenses: Expense[];
}

const CATEGORY_COLORS: Record<string, string> = {
  food:          "#F5C518",
  transport:     "#22D3EE",
  shopping:      "#F472B6",
  utilities:     "#A78BFA",
  health:        "#4ADE80",
  entertainment: "#FB923C",
  other:         "#475569",
};

const CATEGORY_ICONS: Record<string, string> = {
  food:          "🍜",
  transport:     "🚌",
  shopping:      "🛍️",
  utilities:     "💡",
  health:        "❤️",
  entertainment: "🎮",
  other:         "📋",
};

export default function MonthlySummary({ expenses }: Props) {
  const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    if (!e.category) return acc;   // exclude uncategorised from breakdown
    acc[e.category] = (acc[e.category] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {});

  const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a);

  const segments: DonutSegment[] = sorted.map(([cat, amount]) => ({
    pct: amount,
    color: CATEGORY_COLORS[cat] ?? "#475569",
  }));

  if (expenses.length === 0) return null;

  return (
    <div className="flex gap-4 items-center">
      {/* Donut */}
      <div className="relative w-28 h-28 shrink-0">
        <DonutChart segments={segments} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[#F5C518] text-[10px] font-semibold uppercase tracking-wide">รายจ่าย</p>
          <p className="text-white font-black text-sm leading-tight">
            {new Intl.NumberFormat("th-TH", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(total)}
          </p>
          <p className="text-[#3D516B] text-[10px]">บาท</p>
        </div>
      </div>

      {/* Category list */}
      <div className="flex-1 space-y-2 min-w-0">
        {sorted.slice(0, 4).map(([cat, amount]) => {
          const pct = total > 0 ? (amount / total) * 100 : 0;
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm">{CATEGORY_ICONS[cat] ?? "📋"}</span>
                  <span className="text-[#8FA3BF] text-xs truncate">
                    {CATEGORIES[cat as keyof typeof CATEGORIES] ?? cat}
                  </span>
                </div>
                <span className="text-white text-xs font-semibold ml-2 shrink-0">
                  {new Intl.NumberFormat("th-TH", {
                    maximumFractionDigits: 0,
                  }).format(amount)}
                </span>
              </div>
              <div className="h-1 bg-[#1E2D45] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: CATEGORY_COLORS[cat] ?? "#475569",
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
