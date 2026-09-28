"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Save, Trash2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_LABELS } from "@/lib/data";

type Item = {
  id: string;
  category: string;
  name: string;
  laundryPrice: number | null;
  dryCleanPrice: number | null;
  note: string | null;
  sortOrder: number;
  active: boolean;
};

type PriceField = "laundryPrice" | "dryCleanPrice";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "PAKAIAN", label: CATEGORY_LABELS.PAKAIAN },
  { value: "RUMAH_TANGGA", label: CATEGORY_LABELS.RUMAH_TANGGA },
];

const inputCls =
  "tabular h-9 w-28 rounded-md border border-input bg-transparent px-2.5 text-right text-sm " +
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50";

function toInput(v: number | null): string {
  return v === null ? "" : String(v);
}

export default function AdminPricesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [baseline, setBaseline] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState("PAKAIAN");

  const [newName, setNewName] = useState("");
  const [newLaundry, setNewLaundry] = useState("");
  const [newDry, setNewDry] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/prices");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = (await res.json()) as Item[];
      setItems(data);
      setBaseline(data);
    } catch {
      toast.error("Gagal memuat daftar harga");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const changed = useMemo(() => {
    const map = new Map(baseline.map((b) => [b.id, b]));
    return items.filter((i) => {
      const b = map.get(i.id);
      if (!b) return true;
      return (
        b.laundryPrice !== i.laundryPrice ||
        b.dryCleanPrice !== i.dryCleanPrice ||
        b.active !== i.active ||
        b.name !== i.name
      );
    });
  }, [items, baseline]);

  function setPrice(id: string, key: PriceField, raw: string) {
    const digits = raw.replace(/\D/g, "");
    const value = digits === "" ? null : Math.min(Number(digits), 10_000_000);
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        return key === "laundryPrice"
          ? { ...i, laundryPrice: value }
          : { ...i, dryCleanPrice: value };
      })
    );
  }

  async function save() {
    if (changed.length === 0) return;
    setSaving(true);
    try {
      const payload = changed.map((i) => {
        const base = baseline.find((b) => b.id === i.id);
        const out: Record<string, unknown> = { id: i.id };
        if (!base || base.laundryPrice !== i.laundryPrice) out.laundryPrice = i.laundryPrice;
        if (!base || base.dryCleanPrice !== i.dryCleanPrice) out.dryCleanPrice = i.dryCleanPrice;
        if (!base || base.active !== i.active) out.active = i.active;
        if (!base || base.name !== i.name) out.name = i.name;
        return out;
      });

      const res = await fetch("/api/admin/prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan");
        return;
      }
      setBaseline(items);
      toast.success(`${payload.length} item tersimpan`);
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  async function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const l = newLaundry.replace(/\D/g, "");
    const d = newDry.replace(/\D/g, "");

    if (!l && !d) {
      toast.error("Isi minimal satu tarif");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          name: newName.trim(),
          laundryPrice: l ? Number(l) : null,
          dryCleanPrice: d ? Number(d) : null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || "Gagal menambah item");
        return;
      }
      setNewName("");
      setNewLaundry("");
      setNewDry("");
      toast.success("Item ditambahkan");
      await load();
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setAdding(false);
    }
  }

  async function remove(item: Item) {
    if (!window.confirm(`Hapus "${item.name}" dari daftar harga? Tidak bisa dibatalkan.`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/prices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error || "Gagal menghapus");
        return;
      }
      toast.success(`"${item.name}" dihapus`);
      await load();
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Daftar harga</h1>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            {items.length} item · {items.filter((i) => !i.active).length} nonaktif ·{" "}
            {items.filter((i) => i.laundryPrice === null && i.dryCleanPrice === null).length} tanpa
            tarif
          </p>
        </div>
        <Button size="lg" onClick={save} disabled={saving || changed.length === 0}>
          {saving ? (
            "Menyimpan..."
          ) : changed.length > 0 ? (
            <>
              <Save size={15} strokeWidth={2} /> Simpan {changed.length} perubahan
            </>
          ) : (
            <>
              <Save size={15} strokeWidth={2} /> Belum ada perubahan
            </>
          )}
        </Button>
      </header>

      <Alert>
        <Info size={16} />
        <AlertTitle>Cara membaca kolom</AlertTitle>
        <AlertDescription>
          Kosong = sel tarif tidak diisi, tampil &ldquo;Hubungi kami&rdquo; dan tidak bisa
          dipesan pelanggan. Matikan sakelar untuk menyembunyikan item dari form pesanan tanpa
          menghapusnya.
        </AlertDescription>
      </Alert>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList>
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.value} value={c.value}>
              {c.label}
              <span className="tabular ml-1.5 text-muted-foreground">
                {items.filter((i) => i.category === c.value).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((c) => {
          const rows = items.filter((i) => i.category === c.value);
          return (
            <TabsContent key={c.value} value={c.value} className="mt-4">
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jenis</TableHead>
                      <TableHead className="text-right">Laundry</TableHead>
                      <TableHead className="text-right">Dry clean</TableHead>
                      <TableHead className="text-center">Ditampilkan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((item) => (
                      <TableRow key={item.id} className={item.active ? "" : "opacity-60"}>
                        <TableCell className="text-sm">
                          {item.name}
                          {item.note && (
                            <span className="mt-0.5 block max-w-[40ch] text-xs text-muted-foreground">
                              {item.note}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            inputMode="numeric"
                            aria-label={`Tarif laundry ${item.name}`}
                            className={inputCls}
                            value={toInput(item.laundryPrice)}
                            onChange={(e) => setPrice(item.id, "laundryPrice", e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            inputMode="numeric"
                            aria-label={`Tarif dry clean ${item.name}`}
                            className={inputCls}
                            value={toInput(item.dryCleanPrice)}
                            onChange={(e) => setPrice(item.id, "dryCleanPrice", e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={item.active}
                            aria-label={`Tampilkan ${item.name}`}
                            onCheckedChange={(v) =>
                              setItems((prev) =>
                                prev.map((i) => (i.id === item.id ? { ...i, active: v } : i))
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Hapus ${item.name}`}
                            onClick={() => remove(item)}
                          >
                            <Trash2 size={15} strokeWidth={1.75} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tambah item</CardTitle>
          <CardDescription>
            Ditambahkan ke kategori yang sedang terbuka ({CATEGORY_LABELS[category as "PAKAIAN" | "RUMAH_TANGGA"] ?? category}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addItem} className="flex flex-wrap items-end gap-4">
            <div className="min-w-[16rem] flex-1 space-y-2">
              <Label htmlFor="np-name">Nama jenis cucian</Label>
              <Input
                id="np-name"
                required
                placeholder="Misal: Sprei King"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-laundry">Laundry (Rp)</Label>
              <Input
                id="np-laundry"
                inputMode="numeric"
                className={inputCls}
                placeholder="Kosong"
                value={newLaundry}
                onChange={(e) => setNewLaundry(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-dry">Dry clean (Rp)</Label>
              <Input
                id="np-dry"
                inputMode="numeric"
                className={inputCls}
                placeholder="Kosong"
                value={newDry}
                onChange={(e) => setNewDry(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <Button type="submit" disabled={adding}>
              {adding ? "Menambahkan..." : (
                <>
                  <Plus size={15} strokeWidth={2} /> Tambah
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
