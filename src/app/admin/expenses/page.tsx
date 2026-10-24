"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
};

const expenseCategories = [
  { value: "BAHAN", label: "Bahan (detergen, pewangi)" },
  { value: "GAJI", label: "Gaji karyawan" },
  { value: "OPERASIONAL", label: "Operasional (listrik, air, sewa)" },
  { value: "LAINNYA", label: "Lainnya" },
];

const categoryLabels = Object.fromEntries(
  expenseCategories.map(({ value, label }) => [value, label])
);

const inputBase =
  "h-9 rounded-md border border-input bg-transparent px-2.5 text-sm " +
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("OPERASIONAL");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadExpenses = useCallback(async () => {
    const response = await fetch("/api/admin/expenses");
    if (!response.ok) throw new Error("Gagal memuat riwayat pengeluaran");
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error("Data pengeluaran tidak valid");
    setExpenses(data as Expense[]);
  }, []);

  useEffect(() => {
    loadExpenses()
      .catch(() => toast.error("Gagal memuat riwayat pengeluaran"))
      .finally(() => setLoading(false));
  }, [loadExpenses]);

  async function addExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanAmount = amount.replace(/\D/g, "");
    if (!description.trim() || !cleanAmount) {
      toast.error("Isi deskripsi dan jumlah");
      return;
    }

    setAdding(true);
    try {
      const response = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: Number(cleanAmount),
          category,
          date,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Gagal mencatat pengeluaran");

      await loadExpenses();
      setDescription("");
      setAmount("");
      setCategory("OPERASIONAL");
      setDate(new Date().toISOString().slice(0, 10));
      toast.success("Pengeluaran dicatat");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tidak bisa terhubung ke server");
    } finally {
      setAdding(false);
    }
  }

  async function removeExpense(id: string) {
    if (!window.confirm("Hapus pengeluaran ini?")) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Gagal menghapus pengeluaran");
      await loadExpenses();
      toast.success("Pengeluaran dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus pengeluaran");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-12 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pengeluaran</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Catat dan kelola riwayat pengeluaran usaha.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Catat pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={addExpense}
            className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4"
          >
            <div className="w-full space-y-2 sm:flex-1">
              <Label htmlFor="expense-description">Deskripsi</Label>
              <Input
                id="expense-description"
                required
                placeholder="Misal: Beli detergen"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Jumlah (Rp)</Label>
              <Input
                id="expense-amount"
                inputMode="numeric"
                required
                placeholder="50000"
                className={`${inputBase} w-full sm:w-32`}
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Tanggal</Label>
              <Input
                id="expense-date"
                type="date"
                required
                className={`${inputBase} w-full sm:w-36`}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-category">Kategori</Label>
              <select
                id="expense-category"
                className={`${inputBase} w-full sm:w-56`}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {expenseCategories.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={adding} className="w-full sm:w-auto">
              {adding ? "Menyimpan..." : <><Plus size={15} strokeWidth={2} /> Tambah</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat pengeluaran</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {expenses.length === 0 ? (
            <p className="px-4 pb-6 text-sm text-muted-foreground sm:px-6">
              Belum ada pengeluaran tercatat.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 sm:pl-6">Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="pr-4 text-right sm:pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="whitespace-nowrap pl-4 text-muted-foreground sm:pl-6">
                        {formatDateTime(expense.date)}
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{categoryLabels[expense.category] ?? expense.category}</TableCell>
                      <TableCell className="whitespace-nowrap text-right font-medium tabular">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="pr-4 text-right sm:pr-6">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Hapus pengeluaran ${expense.description}`}
                          disabled={deletingId === expense.id}
                          onClick={() => removeExpense(expense.id)}
                        >
                          <Trash2 size={15} strokeWidth={1.75} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
