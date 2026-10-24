"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Download, ShieldAlert } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Legend,
} from "recharts";
import ExcelJS from "exceljs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_STATUSES } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
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
  BAHAN: "Bahan (detergen, pewangi)",
  GAJI: "Gaji karyawan",
  OPERASIONAL: "Operasional (listrik, air, sewa)",
  LAINNYA: "Lainnya",
};

const inputBase =
  "h-9 rounded-md border border-input bg-transparent px-2.5 text-sm " +
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const isOwner = (session?.user as any)?.role === "OWNER";

  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<"month" | "year">("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // 1. Ambil Data HANYA JIKA Owner
  useEffect(() => {
    if (status === "authenticated" && isOwner) {
      Promise.all([
        fetch("/api/orders/admin").then((r) => r.json()),
        fetch("/api/admin/expenses").then((r) => r.json()),
      ])
        .then(([ordersData, expensesData]) => {
          setOrders(Array.isArray(ordersData) ? (ordersData as Order[]) : []);
          setExpenses(Array.isArray(expensesData) ? (expensesData as Expense[]) : []);
        })
        .catch(() => toast.error("Gagal memuat data"))
        .finally(() => setLoading(false));
    } else if (status === "unauthenticated" || (status === "authenticated" && !isOwner)) {
      setLoading(false);
    }
  }, [status, isOwner]);

  const pesananSelesai = useMemo(
    () => orders.filter((o) => o.status === SELESAI_KEY),
    [orders]
  );

  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    orders.forEach((order) => years.add(new Date(order.createdAt).getFullYear()));
    expenses.forEach((expense) => years.add(new Date(expense.date).getUTCFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [orders, expenses]);

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, month) => ({
        value: month,
        label: new Date(selectedYear, month, 1).toLocaleDateString("id-ID", { month: "long" }),
      })),
    [selectedYear]
  );

  const periodIncomeOrders = useMemo(
    () =>
      pesananSelesai.filter((order) => {
        const createdAt = new Date(order.createdAt);
        return (
          createdAt.getFullYear() === selectedYear &&
          (periodType === "year" || createdAt.getMonth() === selectedMonth)
        );
      }),
    [pesananSelesai, periodType, selectedMonth, selectedYear]
  );

  const periodExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getUTCFullYear() === selectedYear &&
          (periodType === "year" || expenseDate.getUTCMonth() === selectedMonth)
        );
      }),
    [expenses, periodType, selectedMonth, selectedYear]
  );

  const pendapatanPeriode = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const periodCount = periodType === "year" ? 12 : daysInMonth;
    const data = Array.from({ length: periodCount }, (_, index) => ({
      key: index,
      label:
        periodType === "year"
          ? months[index].label.slice(0, 3)
          : String(index + 1),
      income: 0,
      expense: 0,
      profit: 0,
    }));

    periodIncomeOrders.forEach((order) => {
      const createdAt = new Date(order.createdAt);
      const index = periodType === "year" ? createdAt.getMonth() : createdAt.getDate() - 1;
      data[index].income += order.total;
    });
    periodExpenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const index = periodType === "year" ? expenseDate.getUTCMonth() : expenseDate.getUTCDate() - 1;
      data[index].expense += expense.amount;
    });
    data.forEach((row) => {
      row.profit = row.income - row.expense;
    });
    return data;
  }, [months, periodExpenses, periodIncomeOrders, periodType, selectedMonth, selectedYear]);

  const pengeluaranPerKategoriPerBulan = useMemo(() => {
    return months.map((month) => {
      const row: Record<string, string | number> = { label: month.label.slice(0, 3) };
      EXPENSE_CATEGORIES.forEach(({ value }) => {
        row[value] = expenses
          .filter((expense) => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getUTCFullYear() === selectedYear && expenseDate.getUTCMonth() === month.value && expense.category === value;
          })
          .reduce((sum, expense) => sum + expense.amount, 0);
      });
      return row;
    });
  }, [expenses, months, selectedYear]);

  const totalPendapatanPeriode = periodIncomeOrders.reduce((sum, order) => sum + order.total, 0);
  const totalPengeluaranPeriode = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const labaRugi = totalPendapatanPeriode - totalPengeluaranPeriode;

  async function exportReport() {
    const periodLabel =
      periodType === "year"
        ? String(selectedYear)
        : `${months[selectedMonth].label} ${selectedYear}`;
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Rossy Laundry";

      const summarySheet = workbook.addWorksheet("Ringkasan");
      summarySheet.addRows([
        ["Laporan keuangan Rossy Laundry"],
        ["Periode", periodLabel],
        ["Pendapatan", totalPendapatanPeriode],
        ["Pengeluaran", totalPengeluaranPeriode],
        ["Laba / rugi", labaRugi],
      ]);

      const trendSheet = workbook.addWorksheet("Tren");
      trendSheet.columns = [
        { header: "Periode", key: "period", width: 20 },
        { header: "Pendapatan", key: "income", width: 18 },
        { header: "Pengeluaran", key: "expense", width: 18 },
        { header: "Laba / rugi", key: "profit", width: 18 },
      ];
      pendapatanPeriode.forEach((row) =>
        trendSheet.addRow({
          period: row.label,
          income: row.income,
          expense: row.expense,
          profit: row.profit,
        })
      );

      const categorySheet = workbook.addWorksheet("Pengeluaran kategori");
      categorySheet.columns = [
        { header: "Bulan", key: "month", width: 18 },
        ...EXPENSE_CATEGORIES.map(({ value, label }) => ({
          header: label.split(" (")[0],
          key: value,
          width: 20,
        })),
      ];
      pengeluaranPerKategoriPerBulan.forEach((row) => {
        categorySheet.addRow({
          month: row.label,
          ...Object.fromEntries(EXPENSE_CATEGORIES.map(({ value }) => [value, row[value]])),
        });
      });

      const expenseSheet = workbook.addWorksheet("Riwayat pengeluaran");
      expenseSheet.columns = [
        { header: "Tanggal", key: "date", width: 18 },
        { header: "Deskripsi", key: "description", width: 32 },
        { header: "Kategori", key: "category", width: 20 },
        { header: "Jumlah", key: "amount", width: 18 },
      ];
      expenses.forEach((expense) =>
        expenseSheet.addRow({
          date: new Date(expense.date).toISOString().slice(0, 10),
          description: expense.description,
          category: CATEGORY_LABELS[expense.category] ?? expense.category,
          amount: expense.amount,
        })
      );

      const incomeSheet = workbook.addWorksheet("Pendapatan pesanan");
      incomeSheet.columns = [
        { header: "Tanggal", key: "date", width: 18 },
        { header: "No. order", key: "orderNumber", width: 22 },
        { header: "Pelanggan", key: "customer", width: 28 },
        { header: "Pendapatan", key: "income", width: 18 },
      ];
      pesananSelesai.forEach((order) =>
        incomeSheet.addRow({
          date: new Date(order.createdAt).toLocaleDateString("id-ID"),
          orderNumber: order.orderNumber,
          customer: order.customerName || order.user?.name || "Tanpa nama",
          income: order.total,
        })
      );

      [trendSheet, categorySheet, expenseSheet, incomeSheet].forEach((sheet) => {
        sheet.getRow(1).font = { bold: true };
        sheet.views = [{ state: "frozen", ySplit: 1 }];
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `laporan-rossy-laundry-${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal mengekspor laporan Excel", error);
      toast.error("Gagal mengekspor laporan ke Excel.");
    }
  }

  // 2. Tampilan Loading (kalau sesi atau data masih dimuat)
  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  // 3. Tampilan Jika BUKAN Owner (Biar gak blink, langsung ditolak)
  if (!isOwner) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <ShieldAlert size={64} className="text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Akses Ditolak</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Halaman laporan keuangan ini bersifat rahasia dan hanya dapat diakses oleh Pemilik (Owner) usaha.
        </p>
      </div>
    );
  }

  // 4. Tampilan Utama Jika Owner
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Laporan keuangan</h1>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            Ringkasan pendapatan, pengeluaran, dan laba/rugi dalam satu menu.
        </p>
        </div>
        <Button type="button" variant="outline" onClick={exportReport}>
          <Download size={16} /> Export Excel
        </Button>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="period-type">Periode laporan</Label>
            <select
              id="period-type"
              className={inputBase + " w-full sm:w-40"}
              value={periodType}
              onChange={(event) => setPeriodType(event.target.value as "month" | "year")}
            >
              <option value="month">Per bulan</option>
              <option value="year">Per tahun</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="period-year">Tahun</Label>
            <select
              id="period-year"
              className={inputBase + " w-full sm:w-32"}
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          {periodType === "month" && (
            <div className="space-y-2">
              <Label htmlFor="period-month">Bulan</Label>
              <select
                id="period-month"
                className={inputBase + " w-full sm:w-40"}
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
              >
                {months.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardDescription className="text-xs sm:text-sm">Pendapatan {periodType === "year" ? "tahun" : "bulan"} ini</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="tabular text-lg font-semibold sm:text-2xl">{formatCurrency(totalPendapatanPeriode)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardDescription className="text-xs sm:text-sm">Pengeluaran {periodType === "year" ? "tahun" : "bulan"} ini</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="tabular text-lg font-semibold sm:text-2xl">{formatCurrency(totalPengeluaranPeriode)}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardDescription className="text-xs sm:text-sm">Laba / rugi {periodType === "year" ? "tahun" : "bulan"} ini</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className={"tabular text-lg font-semibold sm:text-2xl " + (labaRugi >= 0 ? "text-primary" : "text-destructive")}>
              {formatCurrency(labaRugi)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base">
              Pendapatan, pengeluaran & laba/rugi {periodType === "year" ? `per bulan (${selectedYear})` : `per hari (${months[selectedMonth].label} ${selectedYear})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {pendapatanPeriode.every((row) => row.income === 0 && row.expense === 0) ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Belum ada data untuk periode ini.</p>
            ) : (
              <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pendapatanPeriode}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend />
                    <Bar dataKey="income" name="Pendapatan" fill="#2563eb" />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#64748b" />
                    <Bar dataKey="profit" name="Laba / rugi" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base">Pengeluaran per kategori per bulan ({selectedYear})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {periodExpenses.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Belum ada pengeluaran.</p>
            ) : (
              <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pengeluaranPerKategoriPerBulan}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend />
                    {EXPENSE_CATEGORIES.map(({ value, label }, index) => (
                      <Bar
                        key={value}
                        dataKey={value}
                        name={label.split(" (")[0]}
                        fill={["#64748b", "#2563eb", "#f59e0b", "#a855f7"][index]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}