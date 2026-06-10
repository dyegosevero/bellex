import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { DemoModalProvider } from "@/components/landing/DemoModalContext";
import { LandingHero } from "@/components/landing/sections/LandingHero";
import { LandingHowItWorks } from "@/components/landing/sections/LandingHowItWorks";
import { LandingProblem } from "@/components/landing/sections/LandingProblem";
import { LandingStats } from "@/components/landing/sections/LandingStats";
import { LandingFeatures } from "@/components/landing/sections/LandingFeatures";
import { LandingCardSwap } from "@/components/landing/sections/LandingCardSwap";
import { LandingSpotlight } from "@/components/landing/sections/LandingSpotlight";
import { LandingTestimonials } from "@/components/landing/sections/LandingTestimonials";
import { LandingFaq } from "@/components/landing/sections/LandingFaq";
import { LandingTrust } from "@/components/landing/sections/LandingTrust";
import { LandingPricing } from "@/components/landing/sections/LandingPricing";
import { LandingCta } from "@/components/landing/sections/LandingCta";
import { LandingResources } from "@/components/landing/sections/LandingResources";

export default function Landing() {
  return (
    <DemoModalProvider>
    <div className="min-h-screen bg-background font-body text-foreground">
      <LandingNav />
      <LandingHero />
      <LandingStats />
      <LandingProblem />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingResources />
      <LandingCardSwap />
      <LandingSpotlight />
      <LandingTestimonials />
      <LandingFaq />
      <LandingTrust />
      <LandingPricing />
      <LandingCta />
      <LandingFooter />
    </div>
    </DemoModalProvider>
  );
}
