"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, Shirt } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/orders/new", label: "Buat Pesanan" },
  { href: "/orders", label: "Riwayat" },
  { href: "/login", label: "Masuk" },
];

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/reports", label: "Laporan" },
  { href: "/admin/expenses", label: "Pengeluaran" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const items = isAdmin ? adminLinks : links;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Shirt size={18} />
          </span>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Rossy Laundry
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {items.map((l) => (
            <Link key={l.href} href={l.href}
              className={"px-3 py-2 rounded-lg text-sm font-medium transition-colors " +
                (pathname === l.href
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}>
              {l.label}
            </Link>
          ))}
          <button onClick={toggle}
            className="ml-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-slate-200 dark:border-slate-700">
            <div className="px-4 py-3 space-y-1">
              {items.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className={"block px-3 py-2 rounded-lg text-sm font-medium " +
                    (pathname === l.href
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}>
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
