"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Printer, ImageDown, Share2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Struk } from "@/components/Struk";
import type { Order } from "@/lib/types";

/**
 * Tombol "Tampilkan Struk": pratinjau, cetak fisik (A5), simpan foto, atau bagikan.
 * Foto disimpan dengan nama nomor resi.
 */
export function StrukDialog({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const file = `${order.orderNumber}.png`;

  /** Cetak: bungkus window.print() dengan class sementara supaya hanya #struk yang ikut. */
  function print() {
    const root = document.documentElement;
    const done = () => {
      root.classList.remove("printing-struk");
      window.removeEventListener("afterprint", done);
    };
    root.classList.add("printing-struk");
    window.addEventListener("afterprint", done);
    window.print();
    window.setTimeout(done, 3000);
  }

  async function render(): Promise<string> {
    const node = document.getElementById("struk");
    if (!node) throw new Error("Struk tidak ditemukan");
    return toPng(node, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
  }

  async function download() {
    setBusy(true);
    try {
      const dataUrl = await render();
      const a = document.createElement("a");
      a.download = file;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Foto disimpan: ${file}`);
    } catch {
      toast.error("Gagal membuat foto struk.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    setBusy(true);
    try {
      const dataUrl = await render();
      const blob = await (await fetch(dataUrl)).blob();
      const f = new File([blob], file, { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [f] })) {
        await navigator.share({ files: [f], title: `Struk ${order.orderNumber}` });
        toast.success("Struk dibagikan.");
        return;
      }
      // Perangkat tidak mendukung share file -> unduh saja.
      const a = document.createElement("a");
      a.download = file;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Perangkat tidak mendukung berbagi foto. Diunduh: ${file}`);
    } catch (err) {
      // Pengguna membatalkan share sheet menampilkan AbortError - bukan kegagalan.
      if ((err as { name?: string })?.name === "AbortError") {
        toast.info("Berbagi dibatalkan.");
      } else {
        toast.error("Gagal membagikan struk.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText size={15} strokeWidth={1.75} /> Tampilkan Struk
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="tabular">Struk {order.orderNumber}</DialogTitle>
          <DialogDescription>
            Pratinjau sama seperti form cetak Rossy. Bisa dicetak (A5), disimpan sebagai foto,
            atau dibagikan.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-1 overflow-x-auto rounded-lg border border-border bg-muted p-3 sm:p-5">
          <div className="shadow-[0_2px_14px_rgba(0,0,0,0.18)]">
            <Struk order={order} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={print} className="gap-2">
            <Printer size={15} strokeWidth={1.75} /> Cetak
          </Button>
          <Button variant="outline" onClick={download} disabled={busy} className="gap-2">
            <ImageDown size={15} strokeWidth={1.75} />
            {busy ? "Menyiapkan..." : "Simpan foto"}
          </Button>
          <Button variant="outline" onClick={share} disabled={busy} className="gap-2">
            <Share2 size={15} strokeWidth={1.75} /> Bagikan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
