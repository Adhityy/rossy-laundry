"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Wallet, Plus, Trash2 } from "lucide-react";

const categories = ["OPERASIONAL", "BAHAN_BAKU", "GAJI", "LAINNYA"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ description: "", amount: "", category: "OPERASIONAL", date: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = () =>
    fetch("/api/expenses").then(r=>r.json()).then(d=>{setExpenses(Array.isArray(d)?d:[]);setLoading(false);}).catch(()=>setLoading(false));

  useEffect(() => { fetchExpenses(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: form.description, amount: Number(form.amount), category: form.category, date: form.date || undefined }),
      });
      if (res.ok) {
        toast.success("Pengeluaran ditambahkan!");
        setForm({ description: "", amount: "", category: "OPERASIONAL", date: "" });
        fetchExpenses();
      } else { toast.error("Gagal menambah"); }
    } catch { toast.error("Terjadi kesalahan"); }
    setSubmitting(false);
  }

  const total = expenses.reduce((s,e)=>s+e.amount,0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <div className="flex items-center gap-3 mb-8">
          <Wallet size={28} className="text-blue-600" />
          <h1 className="text-3xl font-bold">Laporan Pengeluaran</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mb-4">
              <p className="text-sm text-slate-500">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(total)}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="font-bold">Tambah Pengeluaran</h3>
              <div><label className="text-sm font-medium block mb-1">Deskripsi</label>
                <input type="text" required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm" placeholder="Misal: Beli deterjen" /></div>
              <div><label className="text-sm font-medium block mb-1">Jumlah (Rp)</label>
                <input type="number" required min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm" placeholder="50000" /></div>
              <div><label className="text-sm font-medium block mb-1">Kategori</label>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm">
                  {categories.map(c=><option key={c} value={c}>{c.replace("_"," ")}</option>)}
                </select></div>
              <div><label className="text-sm font-medium block mb-1">Tanggal</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm" /></div>
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <Plus size={16}/> {submitting?"Menyimpan...":"Tambah"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700"><h3 className="font-bold">Daftar Pengeluaran</h3></div>
              {loading ? <div className="p-8 text-center">Memuat...</div> : expenses.length===0 ? (
                <div className="p-8 text-center text-slate-400">Belum ada pengeluaran</div>
              ) : (
                <div className="overflow-y-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0"><tr className="bg-slate-50 dark:bg-slate-800">
                      <th className="text-left px-4 py-3">Tanggal</th><th className="text-left px-4 py-3">Deskripsi</th>
                      <th className="text-left px-4 py-3">Kategori</th><th className="text-right px-4 py-3">Jumlah</th>
                    </tr></thead>
                    <tbody>
                      {expenses.map((e,i)=>(
                        <tr key={e.id} className={"border-t border-slate-100 dark:border-slate-800 "+(i%2?"bg-slate-50/50 dark:bg-slate-900/50":"")}>
                          <td className="px-4 py-3 text-slate-500">{formatDate(e.date)}</td>
                          <td className="px-4 py-3">{e.description}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 dark:bg-orange-900 text-orange-700">{e.category.replace("_"," ")}</span></td>
                          <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
