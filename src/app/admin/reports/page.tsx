"use client";
import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, PieChart } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Expense, Order } from "@/lib/types";

/** One hue, four tints. Keeps the accent lock without losing category separation. */
const PIE_TONES = ["#0f766e", "#0d9488", "#14b8a6", "#5eead4", "#99f6e4"];
const BAR_FILL = "#0f766e";

type Slice = { name: string; value: number };

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/orders/admin").then((r) => r.json()),
      fetch("/api/expenses").then((r) => r.json()),
    ])
      .then(([o, e]) => {
        if (!alive) return;
        setOrders(Array.isArray(o) ? (o as Order[]) : []);
        setExpenses(Array.isArray(e) ? (e as Expense[]) : []);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalRevenue - totalExpense;

  const byMonth = new Map<string, number>();
  for (const o of orders) {
    const key = new Date(o.createdAt).toLocaleString("id-ID", {
      month: "short",
      year: "numeric",
    });
    byMonth.set(key, (byMonth.get(key) ?? 0) + o.total);
  }
  const chartData = [...byMonth.entries()].map(([name, value]) => ({ name, value }));

  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  }
  const pieData: Slice[] = [...byCategory.entries()].map(([name, value]) => ({ name, value }));

  const totals = [
    { icon: DollarSign, label: "Total pendapatan", value: formatCurrency(totalRevenue) },
    { icon: TrendingUp, label: "Total pengeluaran", value: formatCurrency(totalExpense) },
    {
      icon: PieChart,
      label: "Laba / rugi",
      value: formatCurrency(profit),
      tone: profit >= 0 ? "text-primary" : "text-destructive",
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Laporan pendapatan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pendapatan dari pesanan selesai, dibandingkan dengan seluruh pengeluaran.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {totals.map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-card p-5">
            <span className="grid size-9 place-items-center rounded-md bg-accent text-foreground">
              <t.icon size={17} strokeWidth={1.75} />
            </span>
            <p className="mt-3 text-sm text-muted-foreground">{t.label}</p>
            <p className={`tabular mt-1 text-2xl font-semibold ${t.tone ?? ""}`}>{t.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-0 pb-3">
            <CardTitle className="text-base">Pendapatan per bulan</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="grid h-[260px] place-items-center text-sm text-muted-foreground">
                Belum ada pesanan selesai.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} cursor={{ fill: "var(--accent)" }} />
                  <Bar dataKey="value" fill={BAR_FILL} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-3">
            <CardTitle className="text-base">Pengeluaran per kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="grid h-[260px] place-items-center text-sm text-muted-foreground">
                Belum ada pengeluaran tercatat.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <RePieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_TONES[i % PIE_TONES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-base">Tabel transaksi</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {/* Mobile: kartu bertumpuk */}
          <div className="px-4 pb-6 md:hidden">
            <p className="mb-3 text-sm text-muted-foreground">
              {orders.length === 0 ? "Belum ada transaksi." : `Total ${orders.length} pesanan.`}
            </p>
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="tabular text-xs text-muted-foreground">{o.orderNumber}</span>
                    <span className="tabular text-sm font-semibold">{formatCurrency(o.total)}</span>
                  </div>
                  <div className="mt-1.5 font-medium">{o.user?.name || "-"}</div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Desktop: tabel */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableCaption>
                {orders.length === 0 ? "Belum ada transaksi." : `Total ${orders.length} pesanan.`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>No. order</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="tabular text-xs">{o.orderNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </TableCell>
                    <TableCell>{o.user?.name || "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {formatCurrency(o.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
