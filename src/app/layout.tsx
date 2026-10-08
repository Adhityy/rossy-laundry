import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rossy Laundry",
  description:
    "Laundry kiloan dan satuan di Kunciran. Antar jemput, selesai dua hari, harga transparan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={outfit.variable}>
      <body className="min-h-[100dvh] antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100dvh-4rem)] pt-16">{children}</main>
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}