import { LAUNDRY_INFO } from "@/lib/data";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">Rossy Laundry</h3>
            <p className="text-sm">{LAUNDRY_INFO.address}</p>
            <p className="text-sm mt-1">{LAUNDRY_INFO.hours}</p>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-3">Kontak</h3>
            <p className="text-sm">Telp: {LAUNDRY_INFO.phoneDisplay}</p>
            <a href={"https://wa.me/"+LAUNDRY_INFO.whatsapp} target="_blank" rel="noopener noreferrer" className="text-sm text-green-400 hover:text-green-300 inline-block mt-1">WhatsApp</a>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-3">Layanan</h3>
            <ul className="text-sm space-y-1">
              <li>Cuci Kiloan</li>
              <li>Cuci Satuan</li>
              <li>Dry Clean</li>
              <li>Antar Jemput</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-6 text-center text-sm">
          &copy; {new Date().getFullYear()} Rossy Laundry. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
