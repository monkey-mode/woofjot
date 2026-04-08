"use client";

import { useEffect, useRef, useState } from "react";
import { getScanStatus } from "@/lib/api";
import type { ScanResult, ScanStatus as Status } from "@/lib/types";

const STEPS: { status: Status; label: string }[] = [
  { status: "uploaded",   label: "อัปโหลดสำเร็จ" },
  { status: "resizing",   label: "ปรับขนาดรูป" },
  { status: "processing", label: "วิเคราะห์สลิป" },
  { status: "done",       label: "เสร็จสิ้น" },
];

const STATUS_ORDER: Record<Status, number> = {
  pending:    0,
  uploaded:   1,
  resizing:   2,
  processing: 3,
  done:       4,
  failed:     -1,
};

interface Props {
  jobId: string;
  onDone: (result: ScanResult) => void;
  onFailed: () => void;
}

export default function ScanStatus({ jobId, onDone, onFailed }: Props) {
  const [status, setStatus] = useState<Status>("pending");
  const [error, setError] = useState<string | null>(null);
  const attempts = useRef(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      attempts.current += 1;

      if (attempts.current > 30) {
        clearInterval(interval);
        setStatus("failed");
        setError("หมดเวลา กรุณาลองใหม่");
        return;
      }

      try {
        const data = await getScanStatus(jobId);
        setStatus(data.status);

        if (data.status === "done" && data.result) {
          clearInterval(interval);
          onDone(data.result);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setError(data.error ?? "เกิดข้อผิดพลาด");
        }
      } catch {
        // network blip — keep polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, onDone]);

  if (status === "failed") {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-lg">✕</span>
          <p className="text-red-700 font-semibold">เกิดข้อผิดพลาด</p>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={onFailed}
          className="text-sm text-red-600 font-medium underline underline-offset-2"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  const currentStep = STATUS_ORDER[status] ?? 0;

  return (
    <div className="bg-white rounded-2xl p-5 space-y-4 border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin shrink-0" />
        <p className="text-gray-700 font-semibold text-sm">กำลังประมวลผล...</p>
      </div>

      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const stepOrder = STATUS_ORDER[step.status];
          const done = currentStep > stepOrder;
          const active = currentStep === stepOrder;

          return (
            <div key={step.status} className="flex items-center gap-3">
              <div className={`
                w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs
                transition-all duration-300
                ${done   ? "bg-gray-900 text-white" : ""}
                ${active ? "bg-gray-200 ring-2 ring-gray-900 ring-offset-1" : ""}
                ${!done && !active ? "bg-gray-100" : ""}
              `}>
                {done ? "✓" : <span className="text-gray-400">{i + 1}</span>}
              </div>
              <span className={`text-sm transition-colors duration-300 ${
                done   ? "text-gray-900 font-medium" :
                active ? "text-gray-900 font-semibold" :
                         "text-gray-300"
              }`}>
                {step.label}
              </span>
              {active && (
                <span className="ml-auto text-xs text-gray-400 animate-pulse">กำลังดำเนินการ</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
