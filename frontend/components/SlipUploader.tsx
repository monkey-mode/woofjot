"use client";

import { useRef, useState } from "react";
import { presign, uploadToMinIO } from "@/lib/api";
import ScanStatus from "./ScanStatus";
import type { ScanResult } from "@/lib/types";

interface Props {
  onDone: (result: ScanResult) => void;
  onCancel?: () => void;
}

export default function SlipUploader({ onDone, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setJobId(null);
    setUploading(true);

    try {
      const { upload_url, job_id } = await presign(file.name, file.type);
      await uploadToMinIO(upload_url, file);
      setJobId(job_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleScanDone(result: ScanResult) {
    setJobId(null);
    onDone(result);
  }

  function handleRetry() {
    setJobId(null);
    setError(null);
  }

  if (jobId) {
    return <ScanStatus jobId={jobId} onDone={handleScanDone} onFailed={handleRetry} />;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        disabled={uploading}
        className={`
          w-full bg-[#0F1E35] rounded-2xl border-2 border-dashed transition-all
          flex flex-col items-center justify-center gap-3 py-8 px-4
          ${dragOver
            ? "border-[#F5C518] bg-[#F5C518]/5"
            : "border-[#1E2D45] hover:border-[#2A3F58]"
          }
          ${uploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        {uploading ? (
          <>
            <div className="w-8 h-8 border-2 border-[#1E3455] border-t-[#F5C518] rounded-full animate-spin" />
            <p className="text-[#3D516B] text-sm font-medium">กำลังอัปโหลด...</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-[#F5C518]/10 rounded-2xl flex items-center justify-center text-3xl">
              📄
            </div>
            <div className="text-center">
              <p className="text-white font-bold">อัปโหลดสลิป</p>
              <p className="text-[#3D516B] text-sm mt-0.5">วางไฟล์ที่นี่ หรือแตะเพื่อเลือก</p>
              <p className="text-[#2A3F58] text-xs mt-1">JPG · PNG · WEBP</p>
            </div>
          </>
        )}
      </button>

      {onCancel && !uploading && (
        <button
          onClick={onCancel}
          className="w-full text-center text-sm text-[#3D516B] hover:text-white py-1 transition-colors"
        >
          ยกเลิก
        </button>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-900/40 rounded-2xl p-3 flex items-center justify-between">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={handleRetry} className="text-[#F5C518] text-sm font-semibold ml-3 shrink-0">
            ลองใหม่
          </button>
        </div>
      )}
    </div>
  );
}
