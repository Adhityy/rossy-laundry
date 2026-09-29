/**
 * Pencarian nama pemilik nomor lewat OSINT publik.
 *
 * Sasaran: Truecaller. Sumbernya kumpulan kontak sukarela penggunanya (400 juta+),
 * dan satu-satunya yang benar-benar mengembalikan nama untuk nomor Indonesia.
 * Provider lain (Numverify, Twilio, AbstractAPI) hanya mengembalikan operator dan
 * wilayah, bukan nama, jadi tidak dipakai.
 *
 * Endpoint tidak resmi, dipakai terbuka oleh banyak tools OSINT di GitHub:
 *   nvzard/truecaller-unofficial-api
 *   sumithemmadi/truecallerpy
 *   saqibsarwar12/truecaller-api (Cloudflare Worker, bentuk request sama)
 *
 * Butuh `TRUECALLER_TOKEN` (Bearer). Token didapat sekali dari sesi Truecaller
 * (lihat README). Tanpa token fungsi ini diam-diam batal, bukan error.
 */

export type OsintHit = {
  name: string | null;
  source: "osint";
  detail?: string;
};

const ENDPOINT = "https://search5-noneu.truecaller.com/v2/search";
const UA = "Truecaller/15.32.6 (Android;14)";

/** Nomor E.164 tanpa tanda plus, contoh 6287880568880. */
function e164(phone: string): string {
  return (phone || "").replace(/[^\d]/g, "");
}

export async function lookupPhoneName(phone: string): Promise<OsintHit> {
  const token = process.env.TRUECALLER_TOKEN;
  if (!token) return { name: null, source: "osint", detail: "token belum diset" };

  const number = e164(phone);
  if (number.length < 9) return { name: null, source: "osint", detail: "nomor tidak valid" };

  const cc = process.env.TRUECALLER_CC || "ID";
  const url = `${ENDPOINT}?q=${encodeURIComponent(number)}&countryCode=${cc}&type=4&encoding=json`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": UA,
        Accept: "application/json",
        "Accept-Encoding": "identity",
      },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
  } catch (err) {
    const timedOut = (err as { name?: string })?.name === "TimeoutError";
    return {
      name: null,
      source: "osint",
      detail: timedOut ? "jeda waktu (osint lambat)" : "gagal terhubung",
    };
  }

  if (!res.ok) {
    // 401/403 = token kedaluwarsa, 429 = kena batas laju. Jangan diulang di sisi klien.
    return { name: null, source: "osint", detail: `http ${res.status}` };
  }

  try {
    const body = (await res.json()) as {
      data?: Array<{ name?: string; id?: string; phones?: Array<{ carrier?: string }> }>;
    };
    const rows = Array.isArray(body.data) ? body.data : [];

    // Baris pertama kadang hanya entri "phone:xxx" tanpa nama. Ambil yang punya nama betulan.
    const hit = rows.find(
      (r) => typeof r?.name === "string" && r.name.trim().length > 1 && !r.name.startsWith("phone:")
    );
    if (!hit?.name) return { name: null, source: "osint", detail: "tidak ada nama publik" };

    const clean = hit.name.trim().slice(0, 80);
    return { name: clean, source: "osint" };
  } catch {
    return { name: null, source: "osint", detail: "respons tidak terbaca" };
  }
}
