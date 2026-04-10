"use client";

import { useCallback, useEffect, useState } from "react";
import { getExpenses } from "@/lib/api";
import type { Expense } from "@/lib/types";
import SlipUploader from "@/components/SlipUploader";
import ExpenseList from "@/components/ExpenseList";
import MonthlySummary from "@/components/MonthlySummary";

function monthKey(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [sort, setSort] = useState<"date" | "uploaded">("date");
  const [sortReady, setSortReady] = useState(false);

  // Read localStorage once — batched with setSortReady so only one re-render fires.
  useEffect(() => {
    const saved = localStorage.getItem("sort");
    if (saved === "uploaded") setSort("uploaded");
    setSortReady(true);
  }, []);

  const handleSetSort = (s: "date" | "uploaded") => {
    localStorage.setItem("sort", s);
    setSort(s);
  };

  const key = monthKey(offset);

  const refresh = useCallback(async () => {
    try {
      setExpenses(await getExpenses(key, sort));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [key, sort]);

  // Only fetch after sort is initialised from localStorage.
  useEffect(() => {
    if (!sortReady) return;
    refresh();
  }, [refresh, sortReady]);

  const filtered = expenses;
  const total = filtered.reduce((s, e) => s + (e.amount ?? 0), 0);

  const totalFormatted = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(total);

  return (
    <div className="min-h-screen bg-page flex justify-center">
    <div className="w-full max-w-sm min-h-screen bg-accent relative">

      {/* ── Yellow header ── */}
      <div className="px-5 py-14">
        <div className="flex items-center justify-between mb-6">
          <span className="font-black text-page text-lg tracking-tight">🐶 WoofJot</span>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(o => o - 1)}
              className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center font-bold text-page text-lg leading-none transition-colors"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-page w-32 text-center">
              {monthLabel(key)}
            </span>
            <button
              onClick={() => setOffset(o => Math.min(0, o + 1))}
              disabled={offset === 0}
              className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center font-bold text-page text-lg leading-none transition-colors disabled:opacity-25"
            >
              ›
            </button>
          </div>
        </div>

        {/* Total */}
        <p className="text-page/50 text-xs font-semibold uppercase tracking-widest">
          รายจ่ายทั้งหมด
        </p>
        {loading ? (
          <div className="animate-pulse mt-1 space-y-2">
            <div className="h-10 w-48 bg-page/20 rounded-xl" />
            <div className="h-4 w-20 bg-page/15 rounded-lg" />
          </div>
        ) : (
          <>
            <p className="text-page text-4xl font-black tracking-tight mt-1 leading-none">
              {totalFormatted}
            </p>
            <p className="text-page/50 text-sm mt-2 font-medium">
              {filtered.length} รายการ
            </p>
          </>
        )}
      </div>

      {/* ── Dark sliding sheet ── */}
      <div className="bg-page rounded-t-[2rem] min-h-[calc(100vh-200px)] -mt-8 px-4 pt-5 pb-32 space-y-3">

        {/* Sort toggle */}
        <div className="flex rounded-xl bg-surface p-1 gap-1">
          {(["date", "uploaded"] as const).map(s => (
            <button
              key={s}
              onClick={() => handleSetSort(s)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                sortReady && sort === s
                  ? "bg-accent text-page"
                  : "text-muted"
              }`}
            >
              {s === "date" ? "วันที่สลิป" : "วันที่อัปโหลด"}
            </button>
          ))}
        </div>

        <MonthlySummary expenses={filtered} loading={loading} />

        {showUpload && (
          <SlipUploader
            onDone={() => { setShowUpload(false); refresh(); }}
            onCancel={() => setShowUpload(false)}
          />
        )}

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-elevated shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-elevated rounded-full w-2/5" />
                  <div className="h-2.5 bg-elevated rounded-full w-1/3" />
                </div>
                <div className="space-y-2 items-end flex flex-col">
                  <div className="h-3.5 bg-elevated rounded-full w-16" />
                  <div className="h-2 bg-elevated rounded-full w-10" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ExpenseList expenses={filtered} onRefresh={refresh} sort={sort} />
        )}
      </div>

      {/* ── Bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-surface/95 backdrop-blur-sm border-t border-elevated">
        <div className="flex items-end justify-around px-8 pt-3 pb-7 max-w-md mx-auto">

          {/* Home */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-accent">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-accent">หน้าแรก</span>
          </div>

          {/* FAB */}
          <button
            onClick={() => setShowUpload(v => !v)}
            className={`
              w-14 h-14 rounded-full shadow-2xl flex items-center justify-center -mt-7
              transition-all duration-200
              ${showUpload
                ? "bg-lift text-subtle rotate-45 ring-4 ring-lift/40"
                : "bg-accent text-page ring-4 ring-accent/20"
              }
            `}
            aria-label="อัปโหลดสลิป"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>

          {/* Other */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-muted">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-muted">อื่นๆ</span>
          </div>
        </div>
      </nav>
    </div>
    </div>
  );
}
