"use client";

import { useEffect, useRef, useState } from "react";
import { presign, uploadToMinIO, getScanStatus } from "@/lib/api";

const MAX_FILES = 10;

interface Props {
  onDone: () => void;
  onCancel?: () => void;
}

type Phase = "uploading" | "scanning" | "done" | "failed";

interface JobEntry {
  file: File;
  phase: Phase;
  jobId?: string;
  error?: string;
}

// ── Compact per-file row that polls its own job ──────────────────────────────

interface JobRowProps {
  entry: JobEntry;
  onDone: () => void;
  onFailed: (error: string) => void;
}

function JobRow({ entry, onDone, onFailed }: JobRowProps) {
  const attempts = useRef(0);
  const { jobId, phase } = entry;

  useEffect(() => {
    if (!jobId || phase !== "scanning") return;
    attempts.current = 0;
    const interval = setInterval(async () => {
      attempts.current += 1;
      if (attempts.current > 30) {
        clearInterval(interval);
        onFailed("หมดเวลา กรุณาลองใหม่");
        return;
      }
      try {
        const data = await getScanStatus(jobId);
        if (data.status === "done") {
          clearInterval(interval);
          onDone();
        } else if (data.status === "failed") {
          clearInterval(interval);
          onFailed(data.error ?? "เกิดข้อผิดพลาด");
        }
      } catch { /* keep polling */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [jobId, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const spinner = (
    <div className="w-4 h-4 border-2 border-lift border-t-accent rounded-full animate-spin shrink-0" />
  );

  const icon = {
    uploading: spinner,
    scanning:  spinner,
    done:    <span className="w-4 h-4 rounded-full bg-accent flex items-center justify-center text-page text-[9px] font-bold shrink-0">✓</span>,
    failed:  <span className="w-4 h-4 rounded-full bg-red-900/60 flex items-center justify-center text-red-400 text-[9px] font-bold shrink-0">✕</span>,
  }[phase];

  const statusText = {
    uploading: "กำลังอัปโหลด...",
    scanning:  "กำลังวิเคราะห์...",
    done:      "เสร็จสิ้น",
    failed:    entry.error ?? "เกิดข้อผิดพลาด",
  }[phase];

  const statusColor = {
    uploading: "text-muted",
    scanning:  "text-muted",
    done:      "text-accent",
    failed:    "text-red-400",
  }[phase];

  return (
    <div className="flex items-center gap-3 bg-surface rounded-xl px-3 py-2.5">
      {icon}
      <span className="flex-1 text-white text-xs truncate min-w-0">{entry.file.name}</span>
      <span className={`text-xs shrink-0 ${statusColor}`}>{statusText}</span>
    </div>
  );
}

// ── Main uploader ────────────────────────────────────────────────────────────

export default function SlipUploader({ onDone, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const isActive = jobs.length > 0;
  const allSettled = isActive && jobs.every(j => j.phase === "done" || j.phase === "failed");
  const doneCount  = jobs.filter(j => j.phase === "done").length;
  const failCount  = jobs.filter(j => j.phase === "failed").length;

  function updateJob(idx: number, patch: Partial<JobEntry>) {
    setJobs(prev => prev.map((j, i) => (i === idx ? { ...j, ...patch } : j)));
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).slice(0, MAX_FILES);
    if (files.length === 0) return;

    setJobs(files.map(f => ({ file: f, phase: "uploading" })));

    await Promise.all(
      files.map(async (file, idx) => {
        try {
          const { upload_url, job_id } = await presign(file.name, file.type);
          await uploadToMinIO(upload_url, file);
          updateJob(idx, { phase: "scanning", jobId: job_id });
        } catch (e) {
          updateJob(idx, {
            phase: "failed",
            error: e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ",
          });
        }
      })
    );
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }

  // ── Active: show per-file rows ─────────────────────────────────────────────
  if (isActive) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {jobs.map((entry, idx) => (
            <JobRow
              key={idx}
              entry={entry}
              onDone={() => updateJob(idx, { phase: "done" })}
              onFailed={error => updateJob(idx, { phase: "failed", error })}
            />
          ))}
        </div>

        {allSettled ? (
          <div className="flex gap-2 pt-1">
            <button
              onClick={onDone}
              className="flex-1 bg-accent text-page text-sm py-2 rounded-xl font-bold transition-colors"
            >
              {failCount > 0
                ? `ปิด (สำเร็จ ${doneCount} / ล้มเหลว ${failCount})`
                : `เสร็จสิ้น ${doneCount} รายการ`
              }
            </button>
            <button
              onClick={() => setJobs([])}
              className="text-sm text-muted hover:text-white px-4 transition-colors"
            >
              อัปโหลดเพิ่ม
            </button>
          </div>
        ) : onCancel && (
          <button
            onClick={onCancel}
            className="w-full text-center text-sm text-muted hover:text-white py-1 transition-colors"
          >
            ยกเลิก
          </button>
        )}
      </div>
    );
  }

  // ── Idle: file picker ──────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`
          w-full bg-surface rounded-2xl border-2 border-dashed transition-all
          flex flex-col items-center justify-center gap-3 py-8 px-4 cursor-pointer
          ${dragOver ? "border-accent bg-accent/5" : "border-elevated hover:border-line"}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleChange}
        />
        <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-3xl">
          📄
        </div>
        <div className="text-center">
          <p className="text-white font-bold">อัปโหลดสลิป</p>
          <p className="text-muted text-sm mt-0.5">วางไฟล์ที่นี่ หรือแตะเพื่อเลือก</p>
          <p className="text-line text-xs mt-1">สูงสุด {MAX_FILES} ไฟล์ · JPG · PNG · WEBP</p>
        </div>
      </button>

      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full text-center text-sm text-muted hover:text-white py-1 transition-colors"
        >
          ยกเลิก
        </button>
      )}
    </div>
  );
}
