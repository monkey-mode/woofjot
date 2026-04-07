import type {
  Expense,
  ExpenseUpdate,
  PresignResponse,
  ScanStatusResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text);
  }
  return res.json() as Promise<T>;
}

export async function presign(
  filename: string,
  contentType: string
): Promise<PresignResponse> {
  return request<PresignResponse>("/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, content_type: contentType }),
  });
}

export async function uploadToMinIO(
  uploadUrl: string,
  file: File
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Upload failed");
}

export async function getScanStatus(
  jobId: string
): Promise<ScanStatusResponse> {
  return request<ScanStatusResponse>(`/scan/${jobId}`);
}

export async function getExpenses(): Promise<Expense[]> {
  return request<Expense[]>("/expenses");
}

export async function updateExpense(
  id: number,
  body: ExpenseUpdate
): Promise<void> {
  await request<void>(`/expenses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteExpense(id: number): Promise<void> {
  await request<void>(`/expenses/${id}`, { method: "DELETE" });
}
