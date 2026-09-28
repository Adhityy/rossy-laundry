"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { LogIn, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast.error("Email atau password salah");
    } else {
      toast.success("Berhasil masuk!");
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-xl">
          <div className="text-center mb-8">
            <span className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4">
              <LogIn size={28} />
            </span>
            <h1 className="text-2xl font-bold">Masuk ke Akun</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Selamat datang kembali!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="email@contoh.com" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" required value={password} onChange={e=>setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? "Memproses..." : <><span>Masuk</span> <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Belum punya akun? <Link href="/register" className="text-blue-600 hover:underline font-medium">Daftar</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
