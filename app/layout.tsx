import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Rossy Laundry — Laundry Terpercaya",
  description: "Rossy Laundry: laundry kiloan & satuan terpercaya. Jl. Balita 2 No. 85 Kunciran Mas Permai.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Navbar />
          <main className="min-h-screen pt-16">{children}</main>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
