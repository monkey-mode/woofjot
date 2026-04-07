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

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        {uploading ? (
          <p className="text-gray-500">กำลังอัปโหลด...</p>
        ) : (
          <>
            <p className="text-2xl mb-2">📤</p>
            <p className="text-gray-600 font-medium">
              วางสลิปที่นี่ หรือคลิกเพื่อเลือกไฟล์
            </p>
            <p className="text-gray-400 text-sm mt-1">JPG, PNG, WEBP</p>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex justify-between items-center">
          <span className="text-red-600 text-sm">{error}</span>
          <button onClick={handleRetry} className="text-red-500 text-sm underline ml-4">
            ลองใหม่
          </button>
        </div>
      )}

      {jobId && (
        <ScanStatus
          jobId={jobId}
          onDone={handleScanDone}
          onFailed={handleRetry}
        />
      )}
    </div>
  );
}
