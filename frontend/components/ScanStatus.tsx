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
      } catch { /* keep polling */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [jobId, onDone]);

  if (status === "failed") {
    return (
      <div className="bg-[#1E0A0A] border border-red-900/40 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-red-900/50 flex items-center justify-center text-red-400 text-xs font-bold">✕</span>
          <p className="text-red-400 font-semibold text-sm">เกิดข้อผิดพลาด</p>
        </div>
        {error && <p className="text-red-500/70 text-xs pl-8">{error}</p>}
        <button
          onClick={onFailed}
          className="ml-8 text-xs text-[#F5C518] font-semibold underline underline-offset-2"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  const currentStep = STATUS_ORDER[status] ?? 0;

  return (
    <div className="bg-[#0F1E35] border border-[#1E2D45] rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#1E3455] border-t-[#F5C518] rounded-full animate-spin shrink-0" />
        <p className="text-white font-semibold text-sm">กำลังประมวลผลสลิป...</p>
      </div>

      {/* Steps */}
      <div className="space-y-3 pl-1">
        {STEPS.map((step, i) => {
          const stepOrder = STATUS_ORDER[step.status];
          const done = currentStep > stepOrder;
          const active = currentStep === stepOrder;

          return (
            <div key={step.status} className="flex items-center gap-3">
              <div className={`
                w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold
                transition-all duration-300
                ${done   ? "bg-[#F5C518] text-[#0B1426]" : ""}
                ${active ? "bg-[#1E3455] ring-2 ring-[#F5C518]/60 ring-offset-1 ring-offset-[#0F1E35]" : ""}
                ${!done && !active ? "bg-[#1E2D45]" : ""}
              `}>
                {done
                  ? <span>✓</span>
                  : <span className={active ? "text-[#F5C518]" : "text-[#3D516B]"}>{i + 1}</span>
                }
              </div>

              <span className={`text-sm transition-colors duration-300 flex-1 ${
                done   ? "text-[#8FA3BF]" :
                active ? "text-white font-semibold" :
                         "text-[#2A3F58]"
              }`}>
                {step.label}
              </span>

              {active && (
                <span className="text-[10px] text-[#F5C518]/60 animate-pulse font-medium">
                  กำลังดำเนินการ
                </span>
              )}
              {done && (
                <span className="text-[10px] text-[#3D516B]">เสร็จ</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
