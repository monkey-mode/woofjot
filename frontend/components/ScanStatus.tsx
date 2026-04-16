"use client";

import { useEffect, useRef, useState } from "react";
import { getScanStatus } from "@/lib/api";
import type { ScanResult, ScanStatus as Status } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>("pending");
  const [error, setError] = useState<string | null>(null);
  const attempts = useRef(0);

  const STEPS: { status: Status; label: string }[] = [
    { status: "uploaded",   label: t.scanStatus.stepUploaded },
    { status: "resizing",   label: t.scanStatus.stepResizing },
    { status: "processing", label: t.scanStatus.stepProcessing },
    { status: "done",       label: t.scanStatus.stepDone },
  ];

  useEffect(() => {
    const interval = setInterval(async () => {
      attempts.current += 1;
      if (attempts.current > 30) {
        clearInterval(interval);
        setStatus("failed");
        setError(t.scanStatus.timeout);
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
          setError(data.error ?? t.scanStatus.error);
        }
      } catch { /* keep polling */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [jobId, onDone]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "failed") {
    return (
      <div className="bg-[#1E0A0A] border border-red-900/40 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-red-900/50 flex items-center justify-center text-red-400 text-xs font-bold">✕</span>
          <p className="text-red-400 font-semibold text-sm">{t.scanStatus.error}</p>
        </div>
        {error && <p className="text-red-500/70 text-xs pl-8">{error}</p>}
        <button
          onClick={onFailed}
          className="ml-8 text-xs text-accent font-semibold underline underline-offset-2"
        >
          {t.scanStatus.retry}
        </button>
      </div>
    );
  }

  const currentStep = STATUS_ORDER[status] ?? 0;

  return (
    <div className="bg-surface border border-elevated rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-lift border-t-accent rounded-full animate-spin shrink-0" />
        <p className="text-white font-semibold text-sm">{t.scanStatus.header}</p>
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
                ${done   ? "bg-accent text-page" : ""}
                ${active ? "bg-lift ring-2 ring-accent/60 ring-offset-1 ring-offset-surface" : ""}
                ${!done && !active ? "bg-elevated" : ""}
              `}>
                {done
                  ? <span>✓</span>
                  : <span className={active ? "text-accent" : "text-muted"}>{i + 1}</span>
                }
              </div>

              <span className={`text-sm transition-colors duration-300 flex-1 ${
                done   ? "text-faint" :
                active ? "text-white font-semibold" :
                         "text-line"
              }`}>
                {step.label}
              </span>

              {active && (
                <span className="text-[10px] text-accent/60 animate-pulse font-medium">
                  {t.scanStatus.inProgress}
                </span>
              )}
              {done && (
                <span className="text-[10px] text-muted">{t.scanStatus.doneStatus}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
