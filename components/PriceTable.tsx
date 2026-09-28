"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { PRICES_KILOAN, PRICES_SATUAN, LAUNDRY_INFO } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export function PriceTable() {
  const [tab, setTab] = useState("kiloan");
  return (
    <section className="py-20 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Daftar Harga</h2>
          <p className="text-slate-500 dark:text-slate-400">Harga transparan, tanpa biaya tersembunyi.</p>
        </motion.div>
        <div className="flex justify-center gap-2 mb-8">
          <button onClick={()=>setTab("kiloan")} className={"px-6 py-2.5 rounded-xl font-semibold text-sm transition-all "+(tab==="kiloan"?"bg-blue-600 text-white shadow-lg":"bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>Kiloan (per Kg)</button>
          <button onClick={()=>setTab("satuan")} className={"px-6 py-2.5 rounded-xl font-semibold text-sm transition-all "+(tab==="satuan"?"bg-blue-600 text-white shadow-lg":"bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>Satuan (per Potong)</button>
        </div>
        <motion.div key={tab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="max-w-3xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-4 py-3 font-semibold">No</th>
                <th className="text-left px-4 py-3 font-semibold">Jenis</th>
                {tab==="kiloan"?<><th className="text-right px-4 py-3 font-semibold">Laundry</th><th className="text-right px-4 py-3 font-semibold">Dry Clean</th></>:<th className="text-right px-4 py-3 font-semibold">Harga</th>}
              </tr>
            </thead>
            <tbody>
              {tab==="kiloan"?PRICES_KILOAN.map((p,i)=>(
                <tr key={i} className={"border-t border-slate-100 dark:border-slate-800 "+(i%2===0?"bg-white dark:bg-slate-950":"bg-slate-50/50 dark:bg-slate-900/50")}>
                  <td className="px-4 py-2.5 text-slate-400">{i+1}</td>
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-right">{formatCurrency(p.laundry)}/kg</td>
                  <td className="px-4 py-2.5 text-right">{formatCurrency(p.dryClean)}/kg</td>
                </tr>
              )):PRICES_SATUAN.map((p,i)=>(
                <tr key={i} className={"border-t border-slate-100 dark:border-slate-800 "+(i%2===0?"bg-white dark:bg-slate-950":"bg-slate-50/50 dark:bg-slate-900/50")}>
                  <td className="px-4 py-2.5 text-slate-400">{i+1}</td>
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-right">{p.price?formatCurrency(p.price):"-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
        <div className="max-w-3xl mx-auto mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-sm text-blue-800 dark:text-blue-200">
          <strong>Catatan:</strong> Minimal order kiloan 3 Kg. Diskon 10% untuk order di atas 10 Kg. Harga belum termasuk ongkos antar (Rp 5.000). Jam operasional {LAUNDRY_INFO.hours}.
        </div>
      </div>
    </section>
  );
}
