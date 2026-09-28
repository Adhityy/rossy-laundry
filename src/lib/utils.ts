import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RL-${y}${m}${d}-${rand}`;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}

export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Samakan format nomor WhatsApp supaya pencarian pesanan cocok walau ditulis berbeda.
 * "0878 8056-8880", "+62 878-8056-8880", dan "6287880568880" -> 6287880568880
 * Mengembalikan string kosong kalau bukan nomor telepon yang masuk akal.
 */
export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

/** Tampilan yang enak dibaca: 62 878-8056-8880 */
export function formatPhone(digits: string): string {
  const d = (digits || "").replace(/\D/g, "");
  if (d.startsWith("62") && d.length >= 12) {
    const local = d.slice(2);
    return `62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
  }
  return d;
}
