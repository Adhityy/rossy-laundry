/**
 * Pencarian nama pemilik nomor lewat OSINT publik.
 *
 * Sumber: Truecaller. Kumpulan kontak sukarela penggunanya (400 juta+) dan satu-satunya
 * yang benar-benar mengembalikan nama untuk nomor Indonesia. Provider lain (Numverify,
 * Twilio, AbstractAPI) hanya mengembalikan operator dan wilayah, bukan nama.
 *
 * Endpoint tidak resmi, dipakai terbuka oleh banyak tools OSINT di GitHub:
 *   nvzard/truecaller-unofficial-api
 *   sumithemmadi/truecallerpy
 *   saqibsarwar12/truecaller-api   (Cloudflare Worker, bentuk request sama)
 *
 * Butuh TRUECALLER_TOKEN (installationId) yang didapat dari luar: instal Truecaller asli di
 * HP Android, onboarding normal, lalu ambil dari SharedPreferences app (butuh root/ADB).
 * Alur OTP dari server sudah mati sejak ~2025 karena di-gate Play Integrity, jadi script
 * sekali-jalan tidak ada gunanya lagi. Tanpa token fungsi ini diam-diam batal, bukan error.
 */

export type OsintHit = {
  name: string | null;
  source: "osint";
  detail?: string;
};

const SEARCH = "https://search5-noneu.truecaller.com/v2/search";
const UA = "Truecaller/11.75.5 (Android;10)";

/**
 * Parameter mengikuti truecallerpy (sumithemmadi/truecallerpy):
 *   q           = nomor signifikan nasional, TANPA kode negara
 *   countryCode = kode negara numerik ("62"), BUKAN "ID"
 * Salah satunya tetap 200 tapi tidak menemukan apa-apa.
 */
function buildQuery(phone: string): URLSearchParams | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length < 9) return null;

  let cc = process.env.TRUECALLER_CC || "62";
  let local = digits;

  if (digits.startsWith("62")) {
    local = digits.slice(2);
  } else if (digits.startsWith("0")) {
    local = digits.slice(1);
  } else if (!digits.startsWith("8")) {
    local = digits; // sudah kode negara lain, biarkan
  }

  return new URLSearchParams({
    q: local,
    countryCode: cc,
    type: "4",
    locAddr: "",
    placement: "SEARCHRESULTS,HISTORY,DETAILS",
    encoding: "json",
  });
}

/** Header otorisasi. Dibangun dari potongan supaya tidak tertukar saat disimpan. */
function authToken(token: string): string {
  return ["Bearer", token].join(" ");
}

export async function lookupPhoneName(phone: string): Promise<OsintHit> {
  const token = process.env.TRUECALLER_TOKEN;
  if (!token) return { name: null, source: "osint", detail: "token belum diset" };

  const query = buildQuery(phone);
  if (!query) return { name: null, source: "osint", detail: "nomor tidak valid" };

  let res: Response;
  try {
    res = await fetch(`${SEARCH}?${query.toString()}`, {
      headers: {
        Authorization: authToken(token),
        "User-Agent": UA,
        "Content-Type": "application/json; charset=UTF-8",
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
      detail: timedOut ? "jeda waktu, coba lagi" : "gagal terhubung",
    };
  }

  if (!res.ok) {
    // 401 token kedaluwarsa, 429 kena batas laju. Jangan diulang dari klien.
    return { name: null, source: "osint", detail: `http ${res.status}` };
  }

  try {
    const body = (await res.json()) as {
      data?: Array<{ name?: string; id?: string }>;
    };
    const rows = Array.isArray(body.data) ? body.data : [];

    // Baris pertama kadang cuma entri "phone:xxx" tanpa nama. Ambil yang punya nama betulan.
    const hit = rows.find(
      (r) =>
        typeof r?.name === "string" &&
        r.name.trim().length > 1 &&
        !r.name.startsWith("phone:")
    );
    if (!hit?.name) return { name: null, source: "osint", detail: "tidak ada nama publik" };

    return { name: hit.name.trim().slice(0, 80), source: "osint" };
  } catch {
    return { name: null, source: "osint", detail: "respons tidak terbaca" };
  }
}
