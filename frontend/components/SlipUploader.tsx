"use client";

import { useRef, useState } from "react";
import { presign, uploadToMinIO } from "@/lib/api";
import ScanStatus from "./ScanStatus";
import type { ScanResult } from "@/lib/types";

interface Props {
  onDone: (result: ScanResult) => void;
}

export default function SlipUploader({ onDone }: Props) {
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
          w-full bg-white rounded-2xl border-2 border-dashed transition-all
          flex flex-col items-center justify-center gap-3 py-8 px-4
          ${dragOver
            ? "border-gray-900 bg-gray-50"
            : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
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
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm font-medium">กำลังอัปโหลด...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
              📄
            </div>
            <div className="text-center">
              <p className="text-gray-800 font-semibold">อัปโหลดสลิป</p>
              <p className="text-gray-400 text-sm mt-0.5">วางไฟล์ที่นี่ หรือแตะเพื่อเลือก</p>
              <p className="text-gray-300 text-xs mt-1">JPG · PNG · WEBP</p>
            </div>
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center justify-between">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={handleRetry} className="text-red-500 text-sm font-medium ml-3 shrink-0">
            ลองใหม่
          </button>
        </div>
      )}
    </div>
  );
}
