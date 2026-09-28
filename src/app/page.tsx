import { Hero } from "@/components/Hero";
import { ServicesSection } from "@/components/ServicesSection";
import { Features } from "@/components/Features";
import { PriceTable } from "@/components/PriceTable";
import { ContactCta } from "@/components/ContactCta";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <Features />
      <PriceTable />
      <ContactCta />
      <Footer />
    </>
  );
}
