#!/usr/bin/env node
/**
 * Ambil TRUECALLER_TOKEN sekali, lalu setel ke Vercel.
 *
 *   node script/get-truecaller-token.mjs <nomor_internasional> <kode_dari_sms>
 *
 * Contoh:
 *   node script/get-truecaller-token.mjs 6287776610293
 *   # -> kode 6 digit dikirim via SMS, lalu:
 *   node script/get-truecaller-token.mjs 6287776610293 123456
 *
 * Tanpa argumen kedua, permintaan OTP dikirim. Dengan argumen kedua, OTP diverifikasi
 * dan token dicetak. Token inilah yang diset sebagai env TRUECALLER_TOKEN di Vercel.
 */

const SECRET = "lvc22mp3l1sfv6ujg83rd17btt";
const UA = "Truecaller/11.75.5 (Android;10)";
const HEAD = {
  "content-type": "application/json; charset=UTF-8",
  "accept-encoding": "gzip",
  "user-agent": UA,
  clientsecret: SECRET,
};

function rnd(n) {
  const s = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < n; i++) out += s[Math.floor(Math.random() * s.length)];
  return out;
}

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: HEAD,
    body: JSON.stringify(body),
  });
  const raw = Buffer.from(await res.arrayBuffer());
  let text = raw.toString("utf8");
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text.slice(0, 300) };
  }
}

function splitNumber(e164) {
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("62")) return { dial: 62, local: digits.slice(2) };
  throw new Error("Nomor harus diawali 62, contoh 6287776610293");
}

const [, , e164, otp] = process.argv;
if (!e164) {
  console.log("Pakai: node script/get-truecaller-token.mjs 628xxxxxxxxxx [kode_otp]");
  process.exit(1);
}

const { dial, local } = splitNumber(e164);
const requestFile = new URL("../.truecaller-request.json", import.meta.url);

if (!otp) {
  const r = await post("https://account-asia-south1.truecaller.com/v2/sendOnboardingOtp", {
    countryCode: "ID",
    dialingCode: dial,
    installationDetails: {
      app: { buildVersion: 5, majorVersion: 11, minorVersion: 7, store: "GOOGLE_PLAY" },
      device: {
        deviceId: rnd(16),
        language: "en",
        manufacturer: "Samsung",
        model: "Galaxy S10",
        osName: "Android",
        osVersion: "10",
        mobileServices: ["GMS"],
      },
      language: "en",
    },
    phoneNumber: local,
    region: "region-2",
    sequenceNo: 2,
  });
  console.log("sendOnboardingOtp ->", r.status, JSON.stringify(r.data));
  if (r.data && r.data.requestId) {
    const fs = await import("node:fs");
    fs.writeFileSync(requestFile, JSON.stringify({ e164, dial, local, requestId: r.data.requestId }));
    console.log("\nrequestId disimpan:", requestFile.pathname);
    console.log("Jalankan lagi dengan kode OTP dari SMS:");
    console.log(`  node script/get-truecaller-token.mjs ${e164} <kode>`);
  } else {
    console.log("requestId tidak didapat. Cek nomor atau coba lagi nanti.");
    process.exit(1);
  }
} else {
  const fs = await import("node:fs");
  if (!fs.existsSync(requestFile)) {
    console.log("Belum ada requestId. Jalankan tanpa kode OTP dulu.");
    process.exit(1);
  }
  const saved = JSON.parse(fs.readFileSync(requestFile, "utf8"));
  const r = await post("https://account-asia-south1.truecaller.com/v1/verifyOnboardingOtp", {
    countryCode: "ID",
    dialingCode: saved.dial,
    phoneNumber: saved.local,
    requestId: saved.requestId,
    token: otp,
  });
  console.log("verifyOnboardingOtp ->", r.status, JSON.stringify(r.data));

  const token = r.data && (r.data.installationId || r.data.token);
  if (token) {
    console.log("\nTOKEN:", token);
    console.log("\nSetel ke Vercel:");
    console.log(`  cd rossy-laundry && npx vercel env add TRUECALLER_TOKEN production`);
    fs.rmSync(requestFile);
  } else {
    console.log("Token tidak didapat. Kemungkinan kode salah atau requestId kadaluarsa.");
    process.exit(1);
  }
}
