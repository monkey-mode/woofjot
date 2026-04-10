import type {
  Expense,
  ExpenseUpdate,
  PresignResponse,
  ScanStatusResponse,
} from "./types";

const SLIP_API = process.env.NEXT_PUBLIC_SLIP_API_URL ?? "http://localhost:8000";
const EXPENSES_API = process.env.NEXT_PUBLIC_EXPENSES_API_URL ?? "http://localhost:8001";

// const FAKE_DELAY_MS = 2000; // TODO: remove before ship

async function request<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  // await new Promise(r => setTimeout(r, FAKE_DELAY_MS));
  const res = await fetch(`${base}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function presign(
  filename: string,
  contentType: string
): Promise<PresignResponse> {
  return request<PresignResponse>(SLIP_API, "/upload/presign", {
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
  return request<ScanStatusResponse>(SLIP_API, `/scan/${jobId}`);
}

export async function getExpenses(month: string, sort: "date" | "uploaded" = "date"): Promise<Expense[]> {
  return request<Expense[]>(EXPENSES_API, `/expenses?month=${month}&sort=${sort}`);
}

export async function updateExpense(
  id: number,
  body: ExpenseUpdate
): Promise<void> {
  await request<void>(EXPENSES_API, `/expenses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteExpense(id: number): Promise<void> {
  await request<void>(EXPENSES_API, `/expenses/${id}`, { method: "DELETE" });
}
