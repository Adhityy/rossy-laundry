"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { UserPlus, User, Mail, Phone, Lock, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registrasi gagal");
      } else {
        toast.success("Akun berhasil dibuat! Silakan masuk.");
        router.push("/login");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
    setLoading(false);
  }

  const fields = [
    { key: "name", label: "Nama Lengkap", type: "text", icon: User, placeholder: "Nama Anda" },
    { key: "email", label: "Email", type: "email", icon: Mail, placeholder: "email@contoh.com" },
    { key: "phone", label: "No. HP", type: "tel", icon: Phone, placeholder: "08xxxxxxxxxx" },
    { key: "password", label: "Password", type: "password", icon: Lock, placeholder: "Min. 6 karakter" },
  ] as const;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-xl">
          <div className="text-center mb-8">
            <span className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4">
              <UserPlus size={28} />
            </span>
            <h1 className="text-2xl font-bold">Buat Akun Baru</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Daftar untuk mulai pesan laundry</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="text-sm font-medium block mb-1.5">{f.label}</label>
                <div className="relative">
                  <f.icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={f.type} required
                    value={(form as any)[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={f.placeholder}
                  />
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? "Memproses..." : <><span>Daftar</span> <ArrowRight size={16} /></>}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Sudah punya akun? <Link href="/login" className="text-blue-600 hover:underline font-medium">Masuk</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
