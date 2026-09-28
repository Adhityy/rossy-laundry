"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/data";
import { LayoutDashboard, DollarSign, Package, TrendingUp, Clock } from "lucide-react";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/admin")
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => ["PENDING","WASHING","DRYING","IRONING","PACKING"].includes(o.status));

  const stats = [
    { icon: Package, label: "Pesanan Hari Ini", value: todayOrders.length, color: "bg-blue-600" },
    { icon: DollarSign, label: "Pendapatan Hari Ini", value: formatCurrency(todayRevenue), color: "bg-green-600" },
    { icon: TrendingUp, label: "Total Pendapatan", value: formatCurrency(totalRevenue), color: "bg-purple-600" },
    { icon: Clock, label: "Sedang Diproses", value: pending.length, color: "bg-orange-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard size={28} className="text-blue-600" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s,i)=>(
            <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className={"w-10 h-10 rounded-lg "+s.color+" text-white flex items-center justify-center mb-3"}><s.icon size={20}/></span>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-xl font-bold mt-1">{s.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-bold text-lg">Semua Pesanan</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <th className="text-left px-4 py-3">No. Order</th>
                  <th className="text-left px-4 py-3">Pelanggan</th>
                  <th className="text-left px-4 py-3">Tanggal</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-center px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o,i)=>{
                  const si = ORDER_STATUSES.find(s=>s.key===o.status);
                  return (
                    <tr key={o.id} className={"border-t border-slate-100 dark:border-slate-800 "+(i%2?"bg-slate-50/50 dark:bg-slate-900/50":"")}>
                      <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
                      <td className="px-4 py-3">{o.user?.name||"-"}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(o.createdAt)}</td>
                      <td className="px-4 py-3">
                        <select value={o.status} onChange={async e=>{
                          await fetch("/api/orders/"+o.id+"/status",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:e.target.value})});
                          setOrders(prev=>prev.map(x=>x.id===o.id?{...x,status:e.target.value}:x));
                        }} className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs">
                          {ORDER_STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <a href={"/orders/"+o.id} className="text-blue-600 hover:underline text-xs">Detail</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
