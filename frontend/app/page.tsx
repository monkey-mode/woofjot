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

  const refresh = useCallback(async () => {
    try {
      setExpenses(await getExpenses());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const key = monthKey(offset);
  const filtered = expenses.filter(e => e.date?.startsWith(key));
  const total = filtered.reduce((s, e) => s + (e.amount ?? 0), 0);

  const totalFormatted = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(total);

  return (
    <div className="min-h-screen bg-[#0B1426] flex justify-center">
    <div className="w-full max-w-sm min-h-screen bg-[#F5C518] relative">

      {/* ── Yellow header ── */}
      <div className="px-5 pt-14 pb-24">
        <div className="flex items-center justify-between mb-6">
          <span className="font-black text-[#0B1426] text-lg tracking-tight">🐶 WoofJot</span>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(o => o - 1)}
              className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center font-bold text-[#0B1426] text-lg leading-none transition-colors"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-[#0B1426] w-32 text-center">
              {monthLabel(key)}
            </span>
            <button
              onClick={() => setOffset(o => Math.min(0, o + 1))}
              disabled={offset === 0}
              className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center font-bold text-[#0B1426] text-lg leading-none transition-colors disabled:opacity-25"
            >
              ›
            </button>
          </div>
        </div>

        {/* Total */}
        <p className="text-[#0B1426]/50 text-xs font-semibold uppercase tracking-widest">
          รายจ่ายทั้งหมด
        </p>
        <p className="text-[#0B1426] text-4xl font-black tracking-tight mt-1 leading-none">
          {totalFormatted}
        </p>
        <p className="text-[#0B1426]/50 text-sm mt-2 font-medium">
          {filtered.length} รายการ
        </p>
      </div>

      {/* ── Dark sliding sheet ── */}
      <div className="bg-[#0B1426] rounded-t-[2rem] min-h-[calc(100vh-200px)] -mt-8 px-4 pt-5 pb-32 space-y-3">

        <MonthlySummary expenses={filtered} />

        {showUpload && (
          <SlipUploader
            onDone={() => { setShowUpload(false); refresh(); }}
            onCancel={() => setShowUpload(false)}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-[#1E2D45] border-t-[#F5C518] rounded-full animate-spin" />
          </div>
        ) : (
          <ExpenseList expenses={filtered} onRefresh={refresh} />
        )}
      </div>

      {/* ── Bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-[#0F1E35]/95 backdrop-blur-sm border-t border-[#1E2D45]">
        <div className="flex items-end justify-around px-8 pt-3 pb-7 max-w-md mx-auto">

          {/* Home */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#F5C518]">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-[#F5C518]">หน้าแรก</span>
          </div>

          {/* FAB */}
          <button
            onClick={() => setShowUpload(v => !v)}
            className={`
              w-14 h-14 rounded-full shadow-2xl flex items-center justify-center -mt-7
              transition-all duration-200
              ${showUpload
                ? "bg-[#1E3455] text-[#6B7FA3] rotate-45 ring-4 ring-[#1E3455]/40"
                : "bg-[#F5C518] text-[#0B1426] ring-4 ring-[#F5C518]/20"
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
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#3D516B]">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-[#3D516B]">อื่นๆ</span>
          </div>
        </div>
      </nav>
    </div>
    </div>
  );
}
