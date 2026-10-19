import { Hero } from "@/components/Hero";
import { ServicesSection } from "@/components/ServicesSection";
import { ServiceArea } from "@/components/ServiceArea";
import { Features } from "@/components/Features";
import { ReviewSlider } from "@/components/ReviewSlider";
import { PriceTable } from "@/components/PriceTable";
import { ContactCta } from "@/components/ContactCta";
import { Footer } from "@/components/Footer";

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesSection />
      <ServiceArea />
      <Features />
      <ReviewSlider />
      <PriceTable />
      <ContactCta />
      <Footer />
    </>
  );
}