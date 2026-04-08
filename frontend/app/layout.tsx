import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WoofJot — บันทึกค่าใช้จ่าย",
  description: "สแกนสลิปธนาคารไทยด้วย AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-[#0B1426] min-h-screen">{children}</body>
    </html>
  );
}
