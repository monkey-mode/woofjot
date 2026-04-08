"use client";

import { useCallback, useEffect, useState } from "react";
import { getExpenses } from "@/lib/api";
import type { Expense, ScanResult } from "@/lib/types";
import SlipUploader from "@/components/SlipUploader";
import ExpenseList from "@/components/ExpenseList";
import MonthlySummary from "@/components/MonthlySummary";

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleDone(_result: ScanResult) {
    refresh();
  }

  return (
    <div className="min-h-screen bg-[#F2F1EF]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#F2F1EF]/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐶</span>
            <span className="font-bold text-gray-900 tracking-tight">WoofJot</span>
          </div>
          <span className="text-xs text-gray-400">บันทึกค่าใช้จ่าย</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-10 space-y-4 pt-4">
        <MonthlySummary expenses={expenses} />
        <SlipUploader onDone={handleDone} />
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : (
          <ExpenseList expenses={expenses} onRefresh={refresh} />
        )}
      </main>
    </div>
  );
}
