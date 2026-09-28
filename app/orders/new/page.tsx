"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Package, Truck, Bike, FileText, Plus, Minus, Send } from "lucide-react";
import { PRICES_KILOAN, PRICES_SATUAN, DELIVERY_FEE, MIN_ORDER_KG } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function NewOrderPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [service, setService] = useState("kiloan");
  const [deliveryType, setDeliveryType] = useState("PICKUP");
  const [weight, setWeight] = useState(3);
  const [selectedItems, setSelectedItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session === null) router.push("/login");
  }, [session, router]);

  const priceList = service === "kiloan" ? PRICES_KILOAN : PRICES_SATUAN;
  const subtotal = service === "kiloan"
    ? (priceList[0]?.laundry || 7000) * weight
    : selectedItems.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = deliveryType === "DELIVERY" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  function toggleItem(name, price) {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.name === name);
      if (exists) return prev.filter(i => i.name !== name);
      return [...prev, { name, qty: 1, price }];
    });
  }

  function updateQty(name, delta) {
    setSelectedItems(prev =>
      prev.map(i => i.name === name ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );
  }

  async function handleSubmit() {
    if (service === "kiloan" && weight < MIN_ORDER_KG) {
      toast.error("Minimal " + MIN_ORDER_KG + " kg");
      return;
    }
    if (service === "satuan" && selectedItems.length === 0) {
      toast.error("Pilih minimal 1 item");
      return;
    }
    setLoading(true);
    try {
      const items = service === "kiloan"
        ? [{ name: "Laundry Kiloan", qty: weight, price: PRICES_KILOAN[0].laundry }]
        : selectedItems;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: service.toUpperCase(), items,
          weight: service === "kiloan" ? weight : undefined,
          deliveryType, deliveryFee, notes
        }),
      });
      if (res.ok) {
        toast.success("Pesanan berhasil dibuat!");
        router.push("/orders");
      } else { toast.error("Gagal membuat pesanan"); }
    } catch { toast.error("Terjadi kesalahan"); }
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <h1 className="text-3xl font-bold mb-2">Buat Pesanan</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Pilih jenis layanan dan detail pesanan Anda.</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={()=>setService("kiloan")} className={"p-5 rounded-xl border-2 text-left "+(service==="kiloan"?"border-blue-600 bg-blue-50 dark:bg-blue-950/50":"border-slate-200 dark:border-slate-700")}>
            <Package size={24} className="mb-2" /><div className="font-semibold">Kiloan</div><div className="text-sm text-slate-500">Dihitung per Kg</div>
          </button>
          <button onClick={()=>setService("satuan")} className={"p-5 rounded-xl border-2 text-left "+(service==="satuan"?"border-blue-600 bg-blue-50 dark:bg-blue-950/50":"border-slate-200 dark:border-slate-700")}>
            <FileText size={24} className="mb-2" /><div className="font-semibold">Satuan</div><div className="text-sm text-slate-500">Dihitung per Potong</div>
          </button>
        </div>

        {service === "kiloan" && (
          <div className="mb-6 p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <label className="font-semibold block mb-3">Berat (kg)</label>
            <div className="flex items-center gap-4">
              <button onClick={()=>setWeight(Math.max(MIN_ORDER_KG,weight-1))} className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border flex items-center justify-center"><Minus size={16}/></button>
              <input type="number" min={MIN_ORDER_KG} value={weight} onChange={e=>setWeight(Math.max(MIN_ORDER_KG,Number(e.target.value)))}
                className="w-24 text-center py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-lg font-bold" />
              <button onClick={()=>setWeight(weight+1)} className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border flex items-center justify-center"><Plus size={16}/></button>
              <span className="text-sm text-slate-500">Min {MIN_ORDER_KG} kg</span>
            </div>
          </div>
        )}
        {service === "satuan" && (
          <div className="mb-6 p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <label className="font-semibold block mb-3">Pilih Item</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {priceList.filter(p=>p.price!==null).map(item => {
                const sel = selectedItems.find(i=>i.name===item.name);
                return (
                  <button key={item.name} onClick={()=>toggleItem(item.name,item.price)}
                    className={"p-3 rounded-lg border text-left text-sm "+(sel?"border-blue-600 bg-blue-50 dark:bg-blue-950/50":"border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800")}>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-slate-500">{formatCurrency(item.price)}</div>
                    {sel && (
                      <div className="flex items-center gap-1 mt-1">
                        <button onClick={e=>{e.stopPropagation();updateQty(item.name,-1)}} className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-xs">-</button>
                        <span className="text-xs font-bold w-4 text-center">{sel.qty}</span>
                        <button onClick={e=>{e.stopPropagation();updateQty(item.name,1)}} className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-xs">+</button>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={()=>setDeliveryType("PICKUP")} className={"p-5 rounded-xl border-2 text-left "+(deliveryType==="PICKUP"?"border-blue-600 bg-blue-50 dark:bg-blue-950/50":"border-slate-200 dark:border-slate-700")}>
            <Bike size={24} className="mb-2" /><div className="font-semibold">Antar ke Toko</div><div className="text-sm text-slate-500">Gratis</div>
          </button>
          <button onClick={()=>setDeliveryType("DELIVERY")} className={"p-5 rounded-xl border-2 text-left "+(deliveryType==="DELIVERY"?"border-blue-600 bg-blue-50 dark:bg-blue-950/50":"border-slate-200 dark:border-slate-700")}>
            <Truck size={24} className="mb-2" /><div className="font-semibold">Antar Jemput</div><div className="text-sm text-slate-500">{"+"+formatCurrency(DELIVERY_FEE)}</div>
          </button>
        </div>
        <div className="mb-6">
          <label className="font-semibold block mb-2">Catatan (opsional)</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm resize-none"
            placeholder="Misal: baju putih jangan disetrika terlalu panas..." />
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white mb-6">
          <h3 className="font-semibold mb-3">Ringkasan</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Ongkos Antar</span><span>{deliveryFee>0?formatCurrency(deliveryFee):"Gratis"}</span></div>
            <div className="border-t border-white/30 pt-2 flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? "Memproses..." : <><span>Kirim Pesanan</span> <Send size={18}/></>}
        </button>
      </motion.div>
    </div>
  );
}
