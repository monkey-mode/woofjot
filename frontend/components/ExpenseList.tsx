"use client";

import { useState } from "react";
import { deleteExpense, updateExpense } from "@/lib/api";
import type { Category, Expense } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { useI18n, toBCP47 } from "@/lib/i18n";

interface Props {
  expenses: Expense[];
  onRefresh: () => void;
  sort?: "date" | "uploaded";
}

function formatAmount(amount: number | null, bcp47: string) {
  if (amount == null) return "—";
  return new Intl.NumberFormat(bcp47, { minimumFractionDigits: 2 }).format(amount);
}

function groupByDay(expenses: Expense[], sort: "date" | "uploaded"): Record<string, Expense[]> {
  const groups: Record<string, Expense[]> = {};
  for (const e of expenses) {
    const key = sort === "uploaded"
      ? e.created_at.slice(0, 10)
      : (e.date ?? "unknown");
    (groups[key] ??= []).push(e);
  }
  return groups;
}

function dayLabel(key: string, bcp47: string, unknownDate: string): string {
  if (key === "unknown") return unknownDate;
  if (!key.match(/^\d{4}-\d{2}-\d{2}$/)) return key;
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(bcp47, {
    weekday: "short", day: "numeric", month: "short",
  });
}

function formatDateTime(date: string | null, time: string | null, bcp47: string, timeSuffix: string): string {
  const datePart = date
    ? new Date(...(date.split("-").map(Number) as [number, number, number]))
        .toLocaleDateString(bcp47, { day: "numeric", month: "short", year: "2-digit" })
    : null;
  const timePart = time ? time.slice(0, 5) + timeSuffix : null;
  return [datePart, timePart].filter(Boolean).join("  ");
}

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

const INPUT_CLS = "w-full bg-page border border-line rounded-xl px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/50";

interface RowProps {
  expense: Expense;
  onRefresh: () => void;
}

function ExpenseRow({ expense, onRefresh }: RowProps) {
  const { t, locale } = useI18n();
  const bcp47 = toBCP47(locale);

  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const [amount, setAmount] = useState(expense.amount != null ? String(expense.amount) : "");
  const [date, setDate] = useState(expense.date ?? "");
  const [time, setTime] = useState(expense.time ? expense.time.slice(0, 5) : "");
  const [sender, setSender] = useState(expense.sender ?? "");
  const [receiver, setReceiver] = useState(expense.receiver ?? "");
  const [category, setCategory] = useState(expense.category ?? "");
  const [note, setNote] = useState(expense.note ?? "");
  const [saving, setSaving] = useState(false);

  const cat = expense.category ?? null;
  const accentColor = cat ? (CATEGORY_COLORS[cat] ?? "#475569") : "#2A3F58";

  async function save() {
    setSaving(true);
    try {
      await updateExpense(expense.id, {
        ...(amount !== "" && { amount: parseFloat(amount) }),
        ...(date !== "" && { date }),
        ...(time !== "" && { time: time.length === 5 ? `${time}:00` : time }),
        ...(sender !== "" && { sender }),
        ...(receiver !== "" && { receiver }),
        ...(category !== "" && { category }),
        ...(note !== "" && { note }),
      });
      setEditing(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(t.expenseList.confirmDelete)) return;
    await deleteExpense(expense.id);
    onRefresh();
  }

  function handleCollapse() {
    setExpanded(false);
    setEditing(false);
  }

  return (
    <>
      <div className="bg-surface rounded-2xl overflow-hidden border border-elevated">

        {/* ── Collapsed row (always visible, tap to expand) ── */}
        <button
          className="w-full flex items-center gap-3 px-4 py-3 text-left"
          onClick={() => setExpanded(v => !v)}
        >
          {/* Category icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg"
            style={{ backgroundColor: `${accentColor}1A` }}
          >
            {cat ? (CATEGORY_ICONS[cat] ?? "📋") : "🧾"}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${cat ? "text-white" : "text-muted"}`}>
              {cat ? (t.categories[cat as Category] ?? cat) : t.expenseList.noCategory}
            </p>
            {expense.note && (
              <p className="text-muted text-xs truncate mt-0.5">{expense.note}</p>
            )}
            {!expense.note && expense.receiver && (
              <p className="text-muted text-xs truncate mt-0.5">{expense.receiver}</p>
            )}
          </div>

          {/* Amount + chevron */}
          <div className="text-right shrink-0 flex items-center gap-2">
            <div>
              <p className="font-bold text-white text-base">
                {formatAmount(expense.amount, bcp47)}{" "}
                <span className="text-muted text-xs font-normal">฿</span>
              </p>
              <p className="text-line text-[10px] text-right">
                {expense.time ? expense.time.slice(0, 5) : ""}
              </p>
            </div>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={`w-4 h-4 text-line shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Accent bar */}
        <div className="h-px mx-4" style={{ backgroundColor: `${accentColor}30` }} />

        {/* ── Expanded drawer ── */}
        {expanded && (
          <div className="px-4 pt-4 pb-3 space-y-4">

            {/* Slip info section */}
            {!editing && (
              <div className="space-y-3">
                <p className="text-muted text-[10px] font-semibold uppercase tracking-widest">
                  {t.expenseList.slipInfo}
                </p>

                {/* Sender / Receiver + thumbnail side-by-side */}
                <div className="flex gap-3">
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Sender */}
                    {expense.sender && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-accent">
                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted text-[10px]">{t.expenseList.from}</p>
                          <p className="text-white text-sm font-medium truncate">{expense.sender}</p>
                        </div>
                      </div>
                    )}

                    {/* Receiver */}
                    {expense.receiver && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#22D3EE]">
                            <path d="M4 4h16v2H4zm0 6h16v2H4zm0 6h16v2H4z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted text-[10px]">{t.expenseList.to}</p>
                          <p className="text-white text-sm font-medium truncate">{expense.receiver}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Slip thumbnail / manual placeholder */}
                  {(expense.thumbnail_url ?? expense.image_url) ? (
                    <button
                      onClick={() => setLightbox(v => !v)}
                      className="shrink-0 flex flex-col items-center gap-1 self-start"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-line">
                        <img
                          src={(expense.thumbnail_url ?? expense.image_url)!}
                          alt="slip"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-accent text-[10px] font-medium">{t.expenseList.tapToViewSlip}</span>
                    </button>
                  ) : (
                    <div className="shrink-0 flex flex-col items-center gap-1 self-start">
                      <div className="w-20 h-20 rounded-xl border border-line bg-elevated flex items-center justify-center">
                        <span className="text-3xl">✏️</span>
                      </div>
                      <span className="text-muted text-[10px]">{t.expenseList.manualEntryLabel}</span>
                    </div>
                  )}
                </div>

                {/* Expanded slip image */}
                {lightbox && expense.image_url && (
                  <div className="relative">
                    <img
                      src={expense.image_url}
                      alt="slip"
                      className="w-full rounded-xl border border-line"
                    />
                    <button
                      onClick={() => setLightbox(false)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Date/time */}
                <p className="text-muted text-xs">
                  {formatDateTime(expense.date, expense.time, bcp47, t.expenseList.timeSuffix)}
                </p>
              </div>
            )}

            {/* Edit form */}
            {editing && (
              <div className="space-y-2">
                <p className="text-muted text-[10px] font-semibold uppercase tracking-widest">
                  {t.expenseList.editInfo}
                </p>
                <div className="flex gap-2">
                  <input value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder={t.expenseList.amount} type="number" inputMode="decimal"
                    className={INPUT_CLS + " flex-1"} />
                  <input value={date} onChange={e => setDate(e.target.value)}
                    type="date" className={INPUT_CLS + " flex-1"} />
                </div>
                <input value={time} onChange={e => setTime(e.target.value)}
                  type="time" className={INPUT_CLS} />
                <div className="flex gap-2">
                  <input value={sender} onChange={e => setSender(e.target.value)}
                    placeholder={t.expenseList.sender} className={INPUT_CLS + " flex-1"} />
                  <input value={receiver} onChange={e => setReceiver(e.target.value)}
                    placeholder={t.expenseList.receiver} className={INPUT_CLS + " flex-1"} />
                </div>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className={INPUT_CLS}>
                  <option value="">{t.expenseList.selectCategory}</option>
                  {CATEGORIES.map(k => (
                    <option key={k} value={k}>{CATEGORY_ICONS[k]} {t.categories[k]}</option>
                  ))}
                </select>
                <input value={note} onChange={e => setNote(e.target.value)}
                  placeholder={t.expenseList.note} className={INPUT_CLS} />
                <div className="flex gap-2 pt-1">
                  <button onClick={save} disabled={saving}
                    className="flex-1 bg-accent text-page text-sm py-2 rounded-xl font-bold hover:bg-[#E6B800] disabled:opacity-50 transition-colors">
                    {t.expenseList.save}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="text-sm text-muted hover:text-white px-4 transition-colors">
                    {t.expenseList.cancel}
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!editing && (
              <div className="border-t border-elevated pt-3 flex items-center justify-between">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-muted hover:text-accent text-xs font-medium transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  {t.expenseList.editButton}
                </button>
                <button
                  onClick={remove}
                  className="flex items-center gap-1.5 text-muted hover:text-red-400 text-xs font-medium transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                  {t.expenseList.deleteButton}
                </button>
              </div>
            )}

            {/* Collapse button */}
            {!editing && (
              <button
                onClick={handleCollapse}
                className="w-full text-center text-line text-[10px] hover:text-muted transition-colors pt-1"
              >
                {t.expenseList.collapse}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function ExpenseList({ expenses, onRefresh, sort = "date" }: Props) {
  const { t, locale } = useI18n();
  const bcp47 = toBCP47(locale);

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">🐶</div>
        <p className="text-muted font-semibold">{t.expenseList.empty}</p>
        <p className="text-line text-sm mt-1">{t.expenseList.emptyHint}</p>
      </div>
    );
  }

  const groups = groupByDay(expenses, sort);

  return (
    <div className="space-y-5 mt-2">
      {Object.entries(groups).map(([day, items]) => {
        const dayTotal = items.reduce((s, e) => s + (e.amount ?? 0), 0);
        return (
          <div key={day}>
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">
                {dayLabel(day, bcp47, t.expenseList.unknownDate)}
              </p>
              <p className="text-muted text-xs font-semibold">
                {new Intl.NumberFormat(bcp47, { maximumFractionDigits: 0 }).format(dayTotal)} ฿
              </p>
            </div>
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
