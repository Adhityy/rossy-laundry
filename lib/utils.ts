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
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
