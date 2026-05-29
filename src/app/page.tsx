import dynamic from "next/dynamic";
import HeroSection from "@/components/hero-section";

const LandingSections = dynamic(
  () => import("@/components/landing-sections"),
  {
    loading: () => (
      <div className="min-h-[50vh] animate-pulse bg-neutral-50/50" aria-hidden />
    ),
  },
);

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <LandingSections />
    </div>
  );
}
