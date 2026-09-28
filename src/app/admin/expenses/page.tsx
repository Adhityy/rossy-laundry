"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense } from "@/lib/types";

const categories = ["OPERASIONAL", "BAHAN_BAKU", "GAJI", "LAINNYA"] as const;

const categoryLabel = (c: string) => c.replace(/_/g, " ");

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("OPERASIONAL");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(() => {
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((d: unknown) => {
        setExpenses(Array.isArray(d) ? (d as Expense[]) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Jumlah harus lebih dari 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount: value,
          category,
          date: date || undefined,
        }),
      });
      if (!res.ok) {
        setError("Gagal menyimpan pengeluaran. Coba lagi.");
        return;
      }
      toast.success("Pengeluaran ditambahkan.");
      setDescription("");
      setAmount("");
      setDate("");
      fetchExpenses();
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setSubmitting(false);
    }
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Pengeluaran</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Catat bahan, gaji, dan biaya operasional. Totalnya dipakai di laporan laba rugi.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Total pengeluaran</p>
            <p className="tabular mt-1 text-2xl font-semibold text-destructive">
              {formatCurrency(total)}
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-0 pb-3">
              <CardTitle className="text-base">Tambah pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="exp-desc">Deskripsi</Label>
                  <Input
                    id="exp-desc"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Misal: beli deterjen 5 kg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exp-amount">Jumlah (Rp)</Label>
                  <Input
                    id="exp-amount"
                    type="number"
                    min={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exp-cat">Kategori</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="exp-cat" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {categoryLabel(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exp-date">Tanggal</Label>
                  <Input
                    id="exp-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Kosongkan untuk hari ini.</p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Gagal menyimpan</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    "Menyimpan..."
                  ) : (
                    <>
                      <Plus size={15} strokeWidth={2} /> Tambah
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet size={16} strokeWidth={1.75} /> Daftar pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {loading ? (
                <div className="space-y-2 px-6 pb-6">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-11 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableCaption>
                    {expenses.length === 0
                      ? "Belum ada pengeluaran tercatat."
                      : `Total ${expenses.length} catatan.`}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDate(e.date)}
                        </TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {categoryLabel(e.category)}
                        </TableCell>
                        <TableCell className="tabular text-right font-medium">
                          {formatCurrency(e.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
