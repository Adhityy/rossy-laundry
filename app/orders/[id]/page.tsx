"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/data";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const f = () => fetch("/api/orders/" + id).then(r=>r.json()).then(d=>{setOrder(d);setLoading(false);}).catch(()=>setLoading(false));
    f();
    const iv = setInterval(f, 5000);
    return () => clearInterval(iv);
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
  if (!order || order.error) return <div className="text-center py-20 text-slate-400">Pesanan tidak ditemukan</div>;

  const curStep = ORDER_STATUSES.find(s=>s.key===order.status)?.step || 1;
  const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-6"><ArrowLeft size={16}/> Kembali</Link>
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div><h1 className="text-xl font-bold">Tracking Pesanan</h1><p className="font-mono text-sm text-slate-400">{order.orderNumber}</p></div>
            <span className="text-lg font-bold text-blue-600">{formatCurrency(order.total)}</span>
          </div>
          <p className="text-sm text-slate-500 mb-6">{formatDateTime(order.createdAt)} | {order.service} | {order.deliveryType==="DELIVERY"?"Antar Jemput":"Antar ke Toko"}</p>
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="absolute top-4 left-0 h-1 bg-blue-600 rounded transition-all duration-700" style={{width:((curStep-1)/(ORDER_STATUSES.length-1))*100+"%"}} />
            <div className="relative flex justify-between">
              {ORDER_STATUSES.map((s,i)=>(
                <div key={s.key} className="flex flex-col items-center" style={{width:100/ORDER_STATUSES.length+"%"}}>
                  <span className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 "+(i+1<=curStep?"bg-blue-600 border-blue-600 text-white":"bg-white dark:bg-slate-800 border-slate-300 text-slate-400")}>
                    {i+1<=curStep?<Check size={14}/>:i+1}
                  </span>
                  <span className="text-[10px] text-center mt-1 text-slate-500 hidden sm:block">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="font-bold mb-4">Riwayat Status</h2>
          <div className="space-y-3">
            {(order.statusLogs||[]).slice().reverse().map((log,i)=>{
              const si=ORDER_STATUSES.find(s=>s.key===log.status);
              return (
                <div key={i} className="flex items-start gap-3">
                  <span className={"w-3 h-3 rounded-full mt-1.5 shrink-0 "+(si?.color||"bg-gray-400")} />
                  <div><p className="text-sm font-medium">{si?.label||log.status}</p><p className="text-xs text-slate-500">{formatDateTime(log.createdAt)} {log.note?"- "+log.note:""}</p></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <h2 className="font-bold mb-4">Detail Item</h2>
          <div className="space-y-2">
            {Array.isArray(items)&&items.map((item,i)=>(
              <div key={i} className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span>{item.name} x {item.qty}</span><span className="font-medium">{formatCurrency(item.price*item.qty)}</span>
              </div>
            ))}
          </div>
          {order.notes&&<div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-sm text-amber-800 dark:text-amber-200"><strong>Catatan:</strong> {order.notes}</div>}
        </div>
      </motion.div>
    </div>
  );
}
