import { NextResponse } from "next/server";

/**
 * Geocoder publik.
 *
 * Photon (komoot, open source, berbasis OpenStreetMap) dipakai sebagai default karena
 * gratis tanpa API key. Demo server-nya tidak menjanjikan SLA dan akan men-throttle
 * pemakaian berat — cukup untuk kebutuhan alamat jemput sebuah laundry.
 *
 * Untuk kualitas alamat Indonesia yang lebih lengkap, ganti ke Google:
 *   set GOOGLE_MAPS_API_KEY, lalu pakai Geocoding API
 * (Google Maps Platform: 10.000 geocoding/bulan gratis sejak skema per-SKU Maret 2025,
 *  tetapi butuh akun billing + kartu).
 */

const PHOTON = "https://photon.komoot.io";

type PhotonProps = Record<string, string | undefined>;

/** Gabungkan properti Photon jadi satu baris alamat yang bisa dibaca. */
function formatAddress(p: PhotonProps): string {
  const road = [p.housenumber, p.street].filter(Boolean).join(" ");
  const districts = [p.district, p.county].filter(Boolean);
  const city = [p.city, p.town, p.village, p.municipality].find(Boolean);

  const parts = [
    road || p.name,
    ...districts,
    city,
    p.state,
    p.postcode,
    p.country,
  ].filter((x): x is string => Boolean(x && x.length > 0));

  // Buang duplikat berurutan (Photon kadang mengulang nama kota).
  return parts.filter((v, i) => i === 0 || v !== parts[i - 1]).join(", ");
}

async function photon(path: string, params: Record<string, string>) {
  const url = new URL(path, PHOTON);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // Photon menghormati User-Agent valid; tanpa ini bisa diblokir.
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`geocoder ${res.status}`);
  return res.json();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  const q = url.searchParams.get("q");

  // Reverse: koordinat -> alamat (dipakai tombol "lokasi saya")
  if (lat && lon) {
    const nlat = Number(lat);
    const nlon = Number(lon);
    if (!Number.isFinite(nlat) || !Number.isFinite(nlon) || Math.abs(nlat) > 90 || Math.abs(nlon) > 180) {
      return NextResponse.json({ error: "Koordinat tidak valid" }, { status: 400 });
    }
    try {
      const data = await photon("/reverse", { lat: String(nlat), lon: String(nlon) });
      const feature = data?.features?.[0];
      if (!feature?.properties) {
        return NextResponse.json({ address: null });
      }
      const address = formatAddress(feature.properties as PhotonProps);
      return NextResponse.json({
        address,
        lat: feature.geometry?.coordinates?.[1] ?? null,
        lon: feature.geometry?.coordinates?.[0] ?? null,
      });
    } catch {
      return NextResponse.json(
        { error: "Lokasi tidak ditemukan. Isi alamat manual." },
        { status: 502 }
      );
    }
  }

  // Search: teks -> saran alamat (autocomplete)
  if (q && q.trim().length >= 3) {
    try {
      // Photon demo hanya mendukung lang default/de/en/fr -> pakai default (nama lokal
      // dari OSM tetap dikembalikan dalam bahasa aslinya).
      const data = await photon("/api", { q: q.trim(), limit: "6" });
      const items = (data?.features ?? [])
        .map((f: { properties?: PhotonProps }) => {
          const p = (f.properties ?? {}) as PhotonProps;
          const address = formatAddress(p);
          return address ? { address, label: p.name ?? address } : null;
        })
        .filter((x: unknown): x is { address: string; label: string } => x !== null);
      return NextResponse.json({ items });
    } catch {
      return NextResponse.json({ items: [] });
    }
  }

  return NextResponse.json({ error: "q atau lat/lon wajib diisi" }, { status: 400 });
}
