import Link from "next/link";
import { Shirt } from "lucide-react";
import { LAUNDRY_INFO } from "@/lib/data";

const services = ["Cuci kiloan", "Cuci satuan", "Dry clean", "Antar jemput"];

const pages = [
  { label: "Buat pesanan", href: "/orders/new" },
  { label: "Riwayat pesanan", href: "/orders" },
  { label: "Masuk", href: "/login" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
                <Shirt size={16} strokeWidth={2} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">Rossy Laundry</span>
            </Link>
            <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
              {LAUNDRY_INFO.address}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{LAUNDRY_INFO.hours}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Kontak</h3>
            <p className="tabular mt-3 text-sm text-muted-foreground">
              {LAUNDRY_INFO.phoneDisplay}
            </p>
            <a
              href={`https://wa.me/${LAUNDRY_INFO.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-primary hover:underline"
            >
              Chat WhatsApp
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Layanan</h3>
            <ul className="mt-3 space-y-1.5">
              {services.map((item) => (
                <li key={item} className="text-sm text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Halaman</h3>
            <ul className="mt-3 space-y-1.5">
              {pages.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Rossy Laundry
          </p>
          <p className="max-w-[52ch] text-xs leading-relaxed text-muted-foreground/80">
            Foto: Fitrah 9131 (CC BY-SA 3.0), Gabbybratcher (CC BY-SA 4.0), W.carter
            (CC BY-SA 4.0), Shixart1985 (CC BY 2.0), Infrogmation of New Orleans (CC BY
            2.0), via Wikimedia Commons.
          </p>
        </div>
      </div>
    </footer>
  );
}
