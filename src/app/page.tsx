import dynamic from "next/dynamic";

const HeroSection = dynamic(() => import("@/components/hero-section"), {
  loading: () => (
    <div
      className="min-h-[70vh] animate-pulse bg-neutral-50/80 dark:bg-neutral-950/40"
      aria-hidden
    />
  ),
});

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
