import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uji Validitas & Reliabilitas Instrumen — Online",
  description:
    "Upload atau paste data kuesioner Anda, langsung dapatkan hasil uji statistik beserta narasi siap pakai untuk laporan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-page text-ink">{children}</body>
    </html>
  );
}
