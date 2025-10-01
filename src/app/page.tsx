import HeroSection from "@/components/hero-section";
import FeaturesSection from "@/components/features-5";
import Features7 from "@/components/features-7";
import Integrations6 from "@/components/integrations-6";
import Faqs4 from "@/components/faqs-4";
import Content7 from "@/components/content-7";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <Features7 />
      <Integrations6 />
      <Faqs4 />
      <Content7 />
      <Footer />
    </div>
  );
}