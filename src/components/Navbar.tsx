"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Menu, X, Sun, Moon, Shirt, ArrowRight, UserRound } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/orders/new", label: "Buat Pesanan" },
  { href: "/orders", label: "Riwayat" },
];

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/prices", label: "Harga" },
  { href: "/admin/reports", label: "Laporan" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const reduce = useReducedMotion();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      aria-pressed={isDark}
      className={
        "grid size-9 place-items-center rounded-md text-muted-foreground transition-colors " +
        "hover:bg-accent hover:text-foreground focus-visible:outline-none " +
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 " +
        (className ?? "")
      }
    >
      <motion.span
        animate={reduce ? undefined : { rotate: isDark ? 0 : 180, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="grid place-items-center"
      >
        {isDark ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
      </motion.span>
    </button>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const reduce = useReducedMotion();
  // Panel admin harus bisa dicapai dari halaman mana pun selama sesi masih admin,
  // bukan hanya ketika URL-nya sudah berprefix /admin.
  const onAdminPath = pathname.startsWith("/admin");
  const isRoleAdmin =
    (session?.user as { role?: string } | undefined | null)?.role === "ADMIN";
  const isAdmin = onAdminPath || isRoleAdmin;
  const authed = status === "authenticated";
  const items = isAdmin ? adminLinks : links;

  const accountLabel = onAdminPath ? "Lihat Situs" : authed ? "Profil" : "Masuk";
  const accountHref = onAdminPath ? "/" : authed ? "/profile" : "/login";
  const accountPrimary = !onAdminPath && !authed;

  const linkClass = (active: boolean) =>
    [
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-accent text-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-foreground",
    ].join(" ");

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Shirt size={16} strokeWidth={2} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Rossy Laundry</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {items.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={linkClass(isAdmin ? pathname === l.href : l.href === "/" ? pathname === "/" : pathname.startsWith(l.href))}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            asChild
            variant={accountPrimary ? "default" : "outline"}
            className="hidden sm:inline-flex"
          >
            <Link href={accountHref} className="flex items-center gap-1.5">
              {!accountPrimary && !onAdminPath && <UserRound size={15} strokeWidth={2} />}
              {accountLabel}
              {accountPrimary && <ArrowRight size={15} strokeWidth={2} />}
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:hidden"
          >
            {open ? <X size={19} strokeWidth={1.75} /> : <Menu size={19} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? { height: "auto" } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { height: "auto" } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {items.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={linkClass(isAdmin ? pathname === l.href : l.href === "/" ? pathname === "/" : pathname.startsWith(l.href))}
                >
                  {l.label}
                </Link>
              ))}
              <Button
                asChild
                variant={accountPrimary ? "default" : "outline"}
                className="mt-2"
              >
                <Link href={accountHref} onClick={() => setOpen(false)}>
                  {accountLabel}
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
