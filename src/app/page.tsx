import { Hero } from "@/components/Hero";
import { ServicesSection } from "@/components/ServicesSection";
import { Features } from "@/components/Features";
import { ReviewSlider } from "@/components/ReviewSlider";
import { PriceTable } from "@/components/PriceTable";
import { ContactCta } from "@/components/ContactCta";
import { Footer } from "@/components/Footer";

// Tarif dibaca dari DB saat prerender; ISR biar perubahan harga kebawa tanpa deploy ulang.
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <Features />
      {/* Ulasan pelanggan, tepat di atas daftar harga. Tidak dirender kalau belum ada ulasan. */}
      <ReviewSlider />
      <PriceTable />
      <ContactCta />
      <Footer />
    </>
  );
}
