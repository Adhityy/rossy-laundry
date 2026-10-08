"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_STATUSES } from "@/lib/data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Order } from "@/lib/types";

type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
};

const SELESAI_KEY = ORDER_STATUSES.find((s) => s.label === "Selesai")?.key ?? "SELESAI";

const EXPENSE_CATEGORIES = [
  { value: "BAHAN", label: "Bahan (detergen, pewangi)" },
  { value: "GAJI", label: "Gaji karyawan" },
  { value: "OPERASIONAL", label: "Operasional (listrik, air, sewa)" },
  { value: "LAINNYA", label: "Lainnya" },
];

const CATEGORY_LABELS: Record<string, string> = {
  BAHAN: "Bahan",
  GAJI: "Gaji",
  OPERASIONAL: "Operasional",
  LAINNYA: "Lainnya",
};

const inputBase =
  "h-9 rounded-md border border-input bg-transparent px-2.5 text-sm " +
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("OPERASIONAL");

  const load = useCallback(async () => {
    try {
      const [ordersRes, expensesRes] = await Promise.all([
        fetch("/api/orders/admin"),
        fetch("/api/admin/expenses"),
      ]);
      const ordersData = await ordersRes.json();
      const expensesData = await expensesRes.json();
      setOrders(Array.isArray(ordersData) ? (ordersData as Order[]) : []);
      setExpenses(Array.isArray(expensesData) ? (expensesData as Expense[]) : []);
    } catch {
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pesananSelesai = useMemo(
    () => orders.filter((o) => o.status === SELESAI_KEY),
    [orders]
  );

  const totalPendapatan = useMemo(
    () => pesananSelesai.reduce((sum, o) => sum + o.total, 0),
    [pesananSelesai]
  );

  const totalPengeluaran = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const labaRugi = totalPendapatan - totalPengeluaran;

  const pendapatanPerBulan = useMemo(() => {
    const map = new Map<string, { key: string; label: string; total: number }>();
    pesananSelesai.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      const existing = map.get(key);
      if (existing) existing.total += o.total;
      else map.set(key, { key, label, total: o.total });
    });
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [pesananSelesai]);

  const pengeluaranPerKategori = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => { map.set(e.category, (map.get(e.category) ?? 0) + e.amount); });
    return Array.from(map.entries()).map(([key, total]) => ({
      label: CATEGORY_LABELS[key] ?? key, total,
    }));
  }, [expenses]);

  async function addExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanAmount = amount.replace(/\D/g, "");
    if (!desc.trim() || !cleanAmount) { toast.error("Isi deskripsi dan jumlah"); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc.trim(), amount: Number(cleanAmount), category }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error || "Gagal menyimpan"); return;
      }
      toast.success("Pengeluaran dicatat");
      setDesc(""); setAmount(""); setCategory("OPERASIONAL");
      await load();
    } catch { toast.error("Tidak bisa terhubung ke server"); }
    finally { setAdding(false); }
  }

  async function removeExpense(id: string) {
    if (!window.confirm("Hapus pengeluaran ini?")) return;
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Gagal menghapus"); return; }
      toast.success("Pengeluaran dihapus");
      await load();
    } catch { toast.error("Tidak bisa terhubung ke server"); }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-12 sm:px-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Laporan pendapatan</h1>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
          Pendapatan dari pesanan selesai, dibandingkan dengan seluruh pengeluaran.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total pendapatan</CardDescription></CardHeader>
          <CardContent><p className="tabular text-2xl font-semibold">{formatCurrency(totalPendapatan)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total pengeluaran</CardDescription></CardHeader>
          <CardContent><p className="tabular text-2xl font-semibold">{formatCurrency(totalPengeluaran)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Laba / rugi</CardDescription></CardHeader>
          <CardContent>
            <p className={"tabular text-2xl font-semibold " + (labaRugi >= 0 ? "text-primary" : "text-destructive")}>
              {formatCurrency(labaRugi)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Pendapatan per bulan</CardTitle></CardHeader>
          <CardContent>
            {pendapatanPerBulan.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Belum ada pendapatan tercatat.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pendapatanPerBulan}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), "Pendapatan"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pengeluaran per kategori</CardTitle></CardHeader>
          <CardContent>
            {pengeluaranPerKategori.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Belum ada pengeluaran tercatat.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pengeluaranPerKategori}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), "Pengeluaran"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="total" fill="#64748b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Riwayat pendapatan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat pendapatan</CardTitle>
          <CardDescription>
            Daftar pesanan berstatus Selesai. Hanya pesanan ini yang dihitung sebagai pendapatan.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {pesananSelesai.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Belum ada pesanan selesai.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. order</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pesananSelesai.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-muted-foreground">{formatDateTime(o.createdAt)}</TableCell>
                    <TableCell className="tabular text-xs">{o.orderNumber}</TableCell>
                    <TableCell>{o.customerName || o.user?.name || "Tanpa nama"}</TableCell>
                    <TableCell className="tabular text-right font-medium">{formatCurrency(o.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="font-semibold">Total</TableCell>
                  <TableCell className="tabular text-right font-semibold">{formatCurrency(totalPendapatan)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form tambah pengeluaran */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catat pengeluaran</CardTitle>
          <CardDescription>Beli detergen, gaji karyawan, listrik, dan biaya operasional lainnya.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addExpense} className="flex flex-wrap items-end gap-4">
            <div className="min-w-[14rem] flex-1 space-y-2">
              <Label htmlFor="exp-desc">Deskripsi</Label>
              <Input id="exp-desc" required placeholder="Misal: Beli detergen 5 kg" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-amount">Jumlah (Rp)</Label>
              <Input id="exp-amount" inputMode="numeric" required placeholder="50000" className={inputBase + " w-32"} value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-cat">Kategori</Label>
              <select id="exp-cat" className={inputBase + " w-56"} value={category} onChange={(e) => setCategory(e.target.value)}>
                {EXPENSE_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
            <Button type="submit" disabled={adding}>
              {adding ? "Menyimpan..." : (<><Plus size={15} strokeWidth={2} /> Tambah</>)}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Riwayat pengeluaran */}
      <Card>
        <CardHeader><CardTitle className="text-base">Riwayat pengeluaran</CardTitle></CardHeader>
        <CardContent className="px-0">
          {expenses.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">Belum ada pengeluaran tercatat.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{formatDateTime(e.date)}</TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell>{CATEGORY_LABELS[e.category] ?? e.category}</TableCell>
                    <TableCell className="tabular text-right font-medium">{formatCurrency(e.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="icon" aria-label="Hapus" onClick={() => removeExpense(e.id)}>
                        <Trash2 size={15} strokeWidth={1.75} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}