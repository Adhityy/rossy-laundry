import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { PriceTable } from "@/components/PriceTable";
import { ServicesSection } from "@/components/ServicesSection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <Features />
      <PriceTable />
      <Footer />
    </>
  );
}
