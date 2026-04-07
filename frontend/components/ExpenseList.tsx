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
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "long" });
}

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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {expense.image_url && (
            <img
              src={expense.image_url}
              alt="slip"
              className="w-12 h-12 object-cover rounded shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {formatAmount(expense.amount, expense.currency)}
            </p>
            <p className="text-sm text-gray-500">
              {expense.date ?? "—"} {expense.time?.slice(0, 5) ?? ""}
            </p>
            {expense.category && (
              <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full mt-1">
                {CATEGORIES[expense.category as keyof typeof CATEGORIES] ??
                  expense.category}
              </span>
            )}
            {expense.note && (
              <p className="text-sm text-gray-600 mt-1">{expense.note}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm text-blue-600 hover:underline"
          >
            แก้ไข
          </button>
          <button
            onClick={remove}
            className="text-sm text-red-500 hover:underline"
          >
            ลบ
          </button>
        </div>
      </div>

      {editing && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          >
            <option value="">เลือกหมวดหมู่</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="บันทึกย่อ..."
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              บันทึก
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-gray-500 hover:underline"
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
      <p className="text-center text-gray-400 py-8">ยังไม่มีรายการค่าใช้จ่าย</p>
    );
  }

  const groups = groupByMonth(expenses);

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([month, items]) => (
        <div key={month}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {monthLabel(month)}
          </h3>
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
