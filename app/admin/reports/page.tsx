"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart3, DollarSign, TrendingUp, PieChart as PieIcon } from "lucide-react";

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626"];

export default function ReportsPage() {
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders/admin").then(r=>r.json()),
      fetch("/api/expenses").then(r=>r.json())
    ]).then(([o,e]) => {
      setOrders(Array.isArray(o)?o:[]);
      setExpenses(Array.isArray(e)?e:[]);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  const totalRevenue = orders.reduce((s,o)=>s+o.total,0);
  const totalExpense = expenses.reduce((s,e)=>s+e.amount,0);
  const profit = totalRevenue - totalExpense;

  // Group by month for chart
  const monthlyData = {};
  orders.forEach(o => {
    const m = new Date(o.createdAt).toLocaleString("id-ID",{month:"short",year:"numeric"});
    monthlyData[m] = (monthlyData[m]||0) + o.total;
  });
  const chartData = Object.entries(monthlyData).map(([name,value])=>({name,value}));

  // Group expenses by category
  const catData = {};
  expenses.forEach(e => { catData[e.category] = (catData[e.category]||0)+e.amount; });
  const pieData = Object.entries(catData).map(([name,value])=>({name,value}));

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 size={28} className="text-blue-600" />
          <h1 className="text-3xl font-bold">Laporan Pendapatan</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="w-10 h-10 rounded-lg bg-green-600 text-white flex items-center justify-center mb-3"><DollarSign size={20}/></span>
            <p className="text-sm text-slate-500">Total Pendapatan</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center mb-3"><TrendingUp size={20}/></span>
            <p className="text-sm text-slate-500">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className={"w-10 h-10 rounded-lg text-white flex items-center justify-center mb-3 "+(profit>=0?"bg-blue-600":"bg-orange-600")}><PieIcon size={20}/></span>
            <p className="text-sm text-slate-500">Laba / Rugi</p>
            <p className={"text-2xl font-bold "+(profit>=0?"text-blue-600":"text-orange-600")}>{formatCurrency(profit)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold mb-4">Pendapatan per Bulan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={v=>v/1000+"k"} />
                <Tooltip formatter={v=>formatCurrency(v)} />
                <Bar dataKey="value" fill="#2563eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold mb-4">Pengeluaran per Kategori</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={false}>
                    {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v=>formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-slate-400 py-20">Belum ada data pengeluaran</p>}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700"><h2 className="font-bold text-lg">Tabel Transaksi</h2></div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <th className="text-left px-4 py-3">No. Order</th>
                  <th className="text-left px-4 py-3">Tanggal</th>
                  <th className="text-left px-4 py-3">Pelanggan</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o,i)=>(
                  <tr key={o.id} className={"border-t border-slate-100 dark:border-slate-800 "+(i%2?"bg-slate-50/50 dark:bg-slate-900/50":"")}>
                    <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">{o.user?.name||"-"}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">{o.status}</span></td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
