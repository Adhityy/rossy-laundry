"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Email atau password salah.");
        setLoading(false);
        return;
      }
      window.location.href = "/"; // Reload penuh agar sistem membaca sesi baru
    } catch {
      setError("Tidak bisa terhubung ke server.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-24 pb-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Masuk</CardTitle>
          <CardDescription>Pakai akun Anda untuk melanjutkan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Belum punya akun? <Link href="/register" className="font-medium text-primary hover:underline">Daftar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}