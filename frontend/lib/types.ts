export interface PresignResponse {
  upload_url: string;
  key: string;
  job_id: string;
  expires_in: number;
}

export type ScanStatus = "pending" | "uploaded" | "resizing" | "processing" | "done" | "failed";

export interface ScanResult {
  expense_id: number;
  image_id: number;
  image_url: string;
  amount: number | null;
  currency: string;
  date: string | null;
  time: string | null;
}

export interface ScanStatusResponse {
  job_id: string;
  status: ScanStatus;
  result?: ScanResult;
  error?: string;
}

export interface Expense {
  id: number;
  image_id: number;
  image_url: string;
  amount: number | null;
  currency: string;
  date: string | null;
  time: string | null;
  category: string | null;
  sender: string | null;
  receiver: string | null;
  note: string | null;
  created_at: string;
}

export interface ExpenseUpdate {
  amount?: number;
  date?: string;
  time?: string;
  sender?: string;
  receiver?: string;
  category?: string;
  note?: string;
}

export type Category =
  | "food"
  | "transport"
  | "shopping"
  | "utilities"
  | "health"
  | "entertainment"
  | "invest"
  | "other";

export const CATEGORIES: Record<Category, string> = {
  food: "อาหาร",
  transport: "เดินทาง",
  shopping: "ช้อปปิ้ง",
  utilities: "ค่าน้ำค่าไฟ",
  health: "สุขภาพ",
  entertainment: "บันเทิง",
  invest: "ลงทุน",
  other: "อื่นๆ",
};
