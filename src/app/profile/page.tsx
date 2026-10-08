"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Camera, KeyRound, LogOut, Save, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
};

const AVATAR_EDGE = 160;
const MAX_DATA_URL_CHARS = 120_000;
const MAX_SOURCE_BYTES = 5 * 1024 * 1024;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Potong jadi kotak, resize 160x160, keluarkan data URL WebP. */
async function toAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_EDGE;
  canvas.height = AVATAR_EDGE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung browser ini");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_EDGE, AVATAR_EDGE);
  bitmap.close();

  // Safari lama tidak bisa encode WebP dari canvas -> fallback PNG.
  let url = canvas.toDataURL("image/webp", 0.85);
  if (!url.startsWith("data:image/webp")) url = canvas.toDataURL("image/png");
  return url;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [changing, setChanging] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = (await res.json()) as Profile;
      setProfile(data);
      setName(data.name ?? "");
      setPhone(data.phone ?? "");
      setAddress(data.address ?? "");
      setAvatar(data.avatar);
    } catch {
      toast.error("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error("Ukuran gambar maksimal 5 MB");
      return;
    }
    try {
      const url = await toAvatarDataUrl(file);
      if (url.length > MAX_DATA_URL_CHARS) {
        toast.error("Foto terlalu besar setelah dikompres. Coba gambar lain.");
        return;
      }
      setAvatar(url);
    } catch {
      toast.error("Foto tidak bisa dibaca");
    }
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address, avatar }),
      });
      const data = (await res.json()) as { error?: string } & Partial<Profile>;
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan");
        return;
      }
      if (data.name) setProfile((p) => (p ? { ...p, ...data } : p));
      toast.success("Profil tersimpan");
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(null);

    if (next !== confirm) {
      setPwError("Konfirmasi password tidak sama.");
      return;
    }

    setChanging(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPwError(data.error || "Gagal mengganti password");
        return;
      }
      toast.success("Password berhasil diganti");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setPwError("Tidak bisa terhubung ke server");
    } finally {
      setChanging(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-12 sm:px-6">
      <header className="flex items-center gap-5">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={`Foto ${profile.name}`} className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-xl font-semibold text-muted-foreground">
              {initials(profile.name)}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-3xl font-semibold tracking-tight">{profile.name}</h1>
          <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={pickAvatar}
              className="sr-only"
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Camera size={15} strokeWidth={1.75} /> Ubah foto
            </Button>
            {avatar && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar(null)}>
                Hapus foto
              </Button>
            )}
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi akun</CardTitle>
          <CardDescription>
            Email dipakai untuk masuk sehingga tidak bisa diubah di halaman ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-name">Nama</Label>
                <Input id="p-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-email">Email</Label>
                <Input id="p-email" value={profile.email} readOnly disabled aria-describedby="p-email-hint" />
                <p id="p-email-hint" className="text-xs text-muted-foreground">
                  Kunci login, ubah lewat admin.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-phone">Nomor WhatsApp</Label>
                <Input
                  id="p-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="08xxxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-describedby="p-phone-hint"
                />
                <p id="p-phone-hint" className="text-xs text-muted-foreground">
                  10-15 digit, tanpa tanda tambah.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-joined">Terdaftar</Label>
                <Input
                  id="p-joined"
                  readOnly
                  disabled
                  value={new Date(profile.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-address">Alamat</Label>
              <Textarea
                id="p-address"
                rows={3}
                className="resize-none"
                placeholder="Nama jalan, nomor rumah, kelurahan"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  "Menyimpan..."
                ) : (
                  <>
                    <Save size={15} strokeWidth={2} /> Simpan perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound size={16} strokeWidth={1.75} /> Ganti password
          </CardTitle>
          <CardDescription>
            Masukkan password sekarang untuk memastikan ini memang Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw-current">Password sekarang</Label>
              <Input
                id="pw-current"
                type="password"
                required
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pw-new">Password baru</Label>
                <Input
                  id="pw-new"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  aria-describedby="pw-hint"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw-confirm">Ulangi password baru</Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>

            <p id="pw-hint" className="text-xs text-muted-foreground">
              Minimal 8 karakter.
            </p>

            {pwError && (
              <p role="alert" className="text-sm text-destructive">
                {pwError}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={changing}>
                {changing ? (
                  "Mengganti..."
                ) : (
                  <>
                    <Check size={15} strokeWidth={2} /> Ganti password
                  </>
                )}
              </Button>
            </div>
          </form>

          <Separator className="my-6" />

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut size={15} strokeWidth={2} /> Keluar dari akun
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
