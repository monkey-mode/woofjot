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

export default function MonthlySummary({ expenses }: Props) {
  const key = currentMonthKey();
  const monthExpenses = expenses.filter((e) => e.date?.startsWith(key));

  const total = monthExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const byCategory = monthExpenses.reduce<Record<string, number>>(
    (acc, e) => {
      const cat = e.category ?? "other";
      acc[cat] = (acc[cat] ?? 0) + (e.amount ?? 0);
      return acc;
    },
    {}
  );

  const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a);

  const monthLabel = new Date(
    Number(key.slice(0, 4)),
    Number(key.slice(5, 7)) - 1
  ).toLocaleDateString("th-TH", { year: "numeric", month: "long" });

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl p-6 space-y-4">
      <div>
        <p className="text-blue-200 text-sm">{monthLabel}</p>
        <p className="text-3xl font-bold mt-1">
          {new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
          }).format(total)}
        </p>
        <p className="text-blue-200 text-sm mt-1">
          {monthExpenses.length} รายการ
        </p>
      </div>

      {sorted.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-blue-500">
          {sorted.map(([cat, amount]) => {
            const pct = total > 0 ? (amount / total) * 100 : 0;
            return (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-0.5">
                  <span>
                    {CATEGORIES[cat as keyof typeof CATEGORIES] ?? cat}
                  </span>
                  <span>
                    {new Intl.NumberFormat("th-TH", {
                      style: "currency",
                      currency: "THB",
                      minimumFractionDigits: 0,
                    }).format(amount)}
                  </span>
                </div>
                <div className="h-1.5 bg-blue-500 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
