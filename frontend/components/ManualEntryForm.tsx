"use client";

import { useState } from "react";
import { createExpense } from "@/lib/api";
import { CATEGORIES } from "@/lib/types";

interface Props {
  onDone: () => void;
  onCancel?: () => void;
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

const INPUT_CLS = "w-full bg-page border border-line rounded-xl px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/50";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ManualEntryForm({ onDone, onCancel }: Props) {
  const [amount, setAmount]     = useState("");
  const [date, setDate]         = useState(today());
  const [time, setTime]         = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote]         = useState("");
  const [sender, setSender]     = useState("");
  const [receiver, setReceiver] = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) { setError("กรุณากรอกจำนวนเงิน"); return; }
    setError(null);
    setSaving(true);
    try {
      await createExpense({
        amount:   parseFloat(amount),
        date:     date || undefined,
        time:     time ? (time.length === 5 ? `${time}:00` : time) : undefined,
        category: category || undefined,
        note:     note || undefined,
        sender:   sender || undefined,
        receiver: receiver || undefined,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-elevated p-4 space-y-3">
      <p className="text-muted text-[10px] font-semibold uppercase tracking-widest">บันทึกรายการเอง</p>

      {/* Amount + Date */}
      <div className="flex gap-2">
        <input
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="จำนวนเงิน *"
          type="number"
          inputMode="decimal"
          className={INPUT_CLS + " flex-1"}
        />
        <input
          value={date}
          onChange={e => setDate(e.target.value)}
          type="date"
          className={INPUT_CLS + " flex-1"}
        />
      </div>

      {/* Time */}
      <input
        value={time}
        onChange={e => setTime(e.target.value)}
        type="time"
        className={INPUT_CLS}
      />

      {/* Category */}
      <select value={category} onChange={e => setCategory(e.target.value)} className={INPUT_CLS}>
        <option value="">เลือกหมวดหมู่</option>
        {Object.entries(CATEGORIES).map(([k, v]) => (
          <option key={k} value={k}>{CATEGORY_ICONS[k]} {v}</option>
        ))}
      </select>

      {/* Sender / Receiver */}
      <div className="flex gap-2">
        <input
          value={sender}
          onChange={e => setSender(e.target.value)}
          placeholder="จาก (ผู้โอน)"
          className={INPUT_CLS + " flex-1"}
        />
        <input
          value={receiver}
          onChange={e => setReceiver(e.target.value)}
          placeholder="ถึง (ผู้รับ)"
          className={INPUT_CLS + " flex-1"}
        />
      </div>

      {/* Note */}
      <input
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="บันทึกย่อ..."
        className={INPUT_CLS}
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-accent text-page text-sm py-2 rounded-xl font-bold disabled:opacity-50 transition-colors"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted hover:text-white px-4 transition-colors"
          >
            ยกเลิก
          </button>
        )}
      </div>
    </form>
  );
}
