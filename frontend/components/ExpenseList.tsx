"use client";

import { useState } from "react";
import { deleteExpense, updateExpense } from "@/lib/api";
import type { Expense } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

interface Props {
  expenses: Expense[];
  onRefresh: () => void;
}

function formatAmount(amount: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(amount);
}

function groupByDay(expenses: Expense[]): Record<string, Expense[]> {
  const groups: Record<string, Expense[]> = {};
  for (const e of expenses) {
    const key = e.date ?? "ไม่ทราบวันที่";
    (groups[key] ??= []).push(e);
  }
  return groups;
}

function dayLabel(key: string): string {
  if (!key.match(/^\d{4}-\d{2}-\d{2}$/)) return key;
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", {
    weekday: "short", day: "numeric", month: "short",
  });
}

const CATEGORY_ICONS: Record<string, string> = {
  food:          "🍜",
  transport:     "🚌",
  shopping:      "🛍️",
  utilities:     "💡",
  health:        "❤️",
  entertainment: "🎮",
  other:         "📋",
};

const CATEGORY_COLORS: Record<string, string> = {
  food:          "#F5C518",
  transport:     "#22D3EE",
  shopping:      "#F472B6",
  utilities:     "#A78BFA",
  health:        "#4ADE80",
  entertainment: "#FB923C",
  other:         "#475569",
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

  const cat = expense.category ?? null;
  const accentColor = cat ? (CATEGORY_COLORS[cat] ?? "#475569") : "#2A3F58";

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
    <div className="bg-[#0F1E35] rounded-2xl overflow-hidden border border-[#1E2D45]">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Category icon circle */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg"
          style={{ backgroundColor: `${accentColor}1A` }}
        >
          {cat ? (CATEGORY_ICONS[cat] ?? "📋") : "🧾"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm truncate ${cat ? "text-white" : "text-[#3D516B]"}`}>
            {cat ? (CATEGORIES[cat as keyof typeof CATEGORIES] ?? cat) : "ยังไม่ระบุหมวดหมู่"}
          </p>
          {(expense.sender || expense.receiver) && (
            <p className="text-[#3D516B] text-xs truncate mt-0.5">
              {expense.sender && <span>{expense.sender}</span>}
              {expense.sender && expense.receiver && <span className="mx-1">→</span>}
              {expense.receiver && <span>{expense.receiver}</span>}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[#2A3F58] text-xs">
              {expense.time ? expense.time.slice(0, 5) : "—"}
            </p>
            {expense.note && (
              <p className="text-[#3D516B] text-xs truncate">· {expense.note}</p>
            )}
          </div>
        </div>

        {/* Amount + actions */}
        <div className="text-right shrink-0">
          <p className="font-bold text-white text-base">
            {formatAmount(expense.amount)} <span className="text-[#3D516B] text-xs font-normal">฿</span>
          </p>
          <div className="flex gap-2 justify-end mt-0.5">
            <button
              onClick={() => setEditing(!editing)}
              className="text-[10px] text-[#3D516B] hover:text-[#F5C518] transition-colors font-medium"
            >
              แก้ไข
            </button>
            <button
              onClick={remove}
              className="text-[10px] text-[#3D516B] hover:text-red-400 transition-colors font-medium"
            >
              ลบ
            </button>
          </div>
        </div>

        {/* Slip thumbnail */}
        {expense.image_url && (
          <a
            href={expense.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-10 h-10 rounded-xl overflow-hidden border border-[#1E2D45]"
          >
            <img src={expense.image_url} alt="slip" className="w-full h-full object-cover" />
          </a>
        )}
      </div>

      {/* Color accent bar */}
      <div className="h-0.5 mx-4 mb-3 rounded-full" style={{ backgroundColor: `${accentColor}40` }} />

      {/* Edit panel */}
      {editing && (
        <div className="border-t border-[#1E2D45] px-4 py-3 space-y-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-[#1E2D45] border border-[#2A3F58] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518]/50"
          >
            <option value="">เลือกหมวดหมู่</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{CATEGORY_ICONS[k]} {v}</option>
            ))}
          </select>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="บันทึกย่อ..."
            className="w-full bg-[#1E2D45] border border-[#2A3F58] rounded-xl px-3 py-2 text-sm text-white placeholder-[#3D516B] focus:outline-none focus:ring-2 focus:ring-[#F5C518]/50"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="bg-[#F5C518] text-[#0B1426] text-sm px-4 py-2 rounded-xl font-bold hover:bg-[#E6B800] disabled:opacity-50 transition-colors"
            >
              บันทึก
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-[#3D516B] hover:text-white px-3 transition-colors"
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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">🐶</div>
        <p className="text-[#3D516B] font-semibold">ยังไม่มีรายการ</p>
        <p className="text-[#2A3F58] text-sm mt-1">กดปุ่ม + เพื่ออัปโหลดสลิป</p>
      </div>
    );
  }

  const groups = groupByDay(expenses);

  return (
    <div className="space-y-5 mt-2">
      {Object.entries(groups).map(([day, items]) => {
        const dayTotal = items.reduce((s, e) => s + (e.amount ?? 0), 0);
        return (
          <div key={day}>
            {/* Day header */}
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-[#3D516B] text-xs font-semibold uppercase tracking-wider">
                {dayLabel(day)}
              </p>
              <p className="text-[#3D516B] text-xs font-semibold">
                {new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(dayTotal)} ฿
              </p>
            </div>
            {/* Rows */}
            <div className="space-y-2">
              {items.map(e => (
                <ExpenseRow key={e.id} expense={e} onRefresh={onRefresh} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
