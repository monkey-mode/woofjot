"use client";

import { useState } from "react";
import { deleteExpense, updateExpense } from "@/lib/api";
import type { Expense } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

interface Props {
  expenses: Expense[];
  onRefresh: () => void;
}

function formatAmount(amount: number | null, currency: string) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function groupByMonth(expenses: Expense[]): Record<string, Expense[]> {
  const groups: Record<string, Expense[]> = {};
  for (const e of expenses) {
    const key = e.date ? e.date.slice(0, 7) : "ไม่ทราบวันที่";
    (groups[key] ??= []).push(e);
  }
  return groups;
}

function monthLabel(key: string) {
  if (!key.match(/^\d{4}-\d{2}$/)) return key;
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });
}

const CATEGORY_BG: Record<string, string> = {
  food:          "bg-orange-100 text-orange-700",
  transport:     "bg-blue-100 text-blue-700",
  shopping:      "bg-pink-100 text-pink-700",
  utilities:     "bg-yellow-100 text-yellow-700",
  health:        "bg-green-100 text-green-700",
  entertainment: "bg-purple-100 text-purple-700",
  other:         "bg-gray-100 text-gray-600",
};

interface RowProps {
  expense: Expense;
  onRefresh: () => void;
}

function ExpenseRow({ expense, onRefresh }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(expense.category ?? "");
  const [note, setNote] = useState(expense.note ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateExpense(expense.id, {
        category: category || undefined,
        note: note || undefined,
      });
      setEditing(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("ลบรายการนี้?")) return;
    await deleteExpense(expense.id);
    onRefresh();
  }

  const catStyle = CATEGORY_BG[expense.category ?? ""] ?? CATEGORY_BG.other;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="flex items-stretch">
        {/* Slip thumbnail */}
        {expense.image_url ? (
          <a
            href={expense.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-16 bg-gray-50 border-r border-gray-100"
          >
            <img
              src={expense.image_url}
              alt="slip"
              className="w-full h-full object-cover"
            />
          </a>
        ) : (
          <div className="shrink-0 w-16 bg-gray-50 border-r border-gray-100 flex items-center justify-center text-2xl">
            🧾
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-base leading-tight">
                {formatAmount(expense.amount, expense.currency)}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                {expense.date ?? "—"}{expense.time ? ` · ${expense.time.slice(0, 5)}` : ""}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {expense.category && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catStyle}`}>
                    {CATEGORIES[expense.category as keyof typeof CATEGORIES] ?? expense.category}
                  </span>
                )}
                {expense.note && (
                  <span className="text-xs text-gray-500 truncate max-w-[160px]">{expense.note}</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setEditing(!editing)}
                className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors"
              >
                แก้ไข
              </button>
              <button
                onClick={remove}
                className="text-xs text-gray-300 hover:text-red-500 font-medium transition-colors"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-2 bg-gray-50">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">เลือกหมวดหมู่</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="บันทึกย่อ..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-gray-900 text-white text-sm px-4 py-2 rounded-xl hover:bg-gray-700 disabled:opacity-50 font-medium transition-colors"
            >
              บันทึก
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-gray-400 hover:text-gray-600 px-2 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpenseList({ expenses, onRefresh }: Props) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">🐶</div>
        <p className="text-gray-400 font-medium">ยังไม่มีรายการค่าใช้จ่าย</p>
        <p className="text-gray-300 text-sm mt-1">อัปโหลดสลิปเพื่อเริ่มต้น</p>
      </div>
    );
  }

  const groups = groupByMonth(expenses);

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([month, items]) => (
        <div key={month}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {monthLabel(month)}
            </h3>
            <span className="text-xs text-gray-300">{items.length} รายการ</span>
          </div>
          <div className="space-y-2">
            {items.map((e) => (
              <ExpenseRow key={e.id} expense={e} onRefresh={onRefresh} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
