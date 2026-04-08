"use client";

import type { Expense } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

interface Props {
  expenses: Expense[];
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatCompact(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const CATEGORY_COLORS: Record<string, string> = {
  food:          "bg-orange-400",
  transport:     "bg-blue-400",
  shopping:      "bg-pink-400",
  utilities:     "bg-yellow-400",
  health:        "bg-green-400",
  entertainment: "bg-purple-400",
  other:         "bg-gray-400",
};

export default function MonthlySummary({ expenses }: Props) {
  const key = currentMonthKey();
  const monthExpenses = expenses.filter((e) => e.date?.startsWith(key));
  const total = monthExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const byCategory = monthExpenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category ?? "other";
    acc[cat] = (acc[cat] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {});

  const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a).slice(0, 4);

  const monthLabel = new Date(
    Number(key.slice(0, 4)),
    Number(key.slice(5, 7)) - 1
  ).toLocaleDateString("th-TH", { year: "numeric", month: "long" });

  return (
    <div className="bg-gray-900 text-white rounded-2xl p-5 space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{monthLabel}</p>
          <p className="text-4xl font-bold mt-1 tracking-tight">
            {new Intl.NumberFormat("th-TH", {
              style: "currency",
              currency: "THB",
              minimumFractionDigits: 2,
            }).format(total)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">รายการ</p>
          <p className="text-2xl font-bold">{monthExpenses.length}</p>
        </div>
      </div>

      {/* Category breakdown */}
      {sorted.length > 0 && (
        <div className="space-y-2 pt-1">
          {/* Stacked bar */}
          <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
            {sorted.map(([cat, amount]) => (
              <div
                key={cat}
                className={`${CATEGORY_COLORS[cat] ?? "bg-gray-400"} rounded-full`}
                style={{ width: `${total > 0 ? (amount / total) * 100 : 0}%` }}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {sorted.map(([cat, amount]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_COLORS[cat] ?? "bg-gray-400"}`} />
                <span className="text-gray-300 text-xs">
                  {CATEGORIES[cat as keyof typeof CATEGORIES] ?? cat}
                </span>
                <span className="text-gray-400 text-xs">{formatCompact(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthExpenses.length === 0 && (
        <p className="text-gray-500 text-sm">ยังไม่มีรายการเดือนนี้</p>
      )}
    </div>
  );
}
