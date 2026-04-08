"use client";

import { useEffect, useRef, useState } from "react";
import { getScanStatus } from "@/lib/api";
import type { ScanResult, ScanStatus as Status } from "@/lib/types";

const STATUS_LABEL: Record<Status, string> = {
  pending: "รอการอัปโหลด...",
  uploaded: "อัปโหลดสำเร็จ กำลังเตรียม...",
  resizing: "กำลังปรับขนาดรูปภาพ...",
  processing: "กำลังประมวลผล...",
  done: "เสร็จสิ้น",
  failed: "เกิดข้อผิดพลาด",
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

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-3">
        {status !== "failed" && (
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        )}
        <span className="text-blue-700 font-medium">{STATUS_LABEL[status]}</span>
      </div>
      {error && (
        <div className="flex items-center justify-between">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={onFailed} className="text-sm text-red-500 underline ml-4">
            ลองใหม่
          </button>
        </div>
      )}
    </div>
  );
}
