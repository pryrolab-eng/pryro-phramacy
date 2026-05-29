"use client";

import FeaturesSection from "@/components/features-5";
import Features7 from "@/components/features-7";
import Faqs4 from "@/components/faqs-4";
import Content7 from "@/components/content-7";
import MeetCustomers from "@/components/meet-customers";
import Footer from "@/components/footer";

/** Below-the-fold marketing sections (lazy-loaded from home page). */
export default function LandingSections() {
  return (
    <>
      <FeaturesSection />
      <Features7 />
      <Faqs4 />
      <Content7 />
      <MeetCustomers />
      <Footer />
    </>
  );
}
