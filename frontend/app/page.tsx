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
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🐶</span>
        <div>
          <h1 className="text-xl font-bold text-gray-900">หมาจด / WoofJot</h1>
          <p className="text-sm text-gray-500">บันทึกค่าใช้จ่ายจากสลิปธนาคาร</p>
        </div>
      </div>

      <MonthlySummary expenses={expenses} />

      <SlipUploader onDone={handleDone} />

      {loading ? (
        <p className="text-center text-gray-400">กำลังโหลด...</p>
      ) : (
        <ExpenseList expenses={expenses} onRefresh={refresh} />
      )}
    </main>
  );
}
