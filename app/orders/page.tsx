"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/data";
import { History, Eye, Package } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalSpent = orders.reduce((s, o) => s + o.total, 0);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <div className="flex items-center gap-3 mb-2">
          <History size={28} className="text-blue-600" />
          <h1 className="text-3xl font-bold">Riwayat Pesanan</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Total pengeluaran: <strong className="text-blue-600">{formatCurrency(totalSpent)}</strong></p>

        {orders.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Belum ada pesanan</p>
            <Link href="/orders/new" className="inline-block mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Buat Pesanan</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const statusInfo = ORDER_STATUSES.find(s => s.key === order.status);
              return (
                <motion.div key={order.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-slate-400">{order.orderNumber}</span>
                        <span className={"px-2 py-0.5 rounded-full text-xs font-medium text-white "+(statusInfo?.color||"bg-gray-400")}>
                          {statusInfo?.label || order.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{formatDateTime(order.createdAt)}</p>
                      <p className="text-sm mt-1">Service: <strong>{order.service}</strong> | {order.deliveryType === "DELIVERY" ? "Antar Jemput" : "Antar ke Toko"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(order.total)}</p>
                      <Link href={"/orders/" + order.id}
                        className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                        <Eye size={14} /> Detail
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
