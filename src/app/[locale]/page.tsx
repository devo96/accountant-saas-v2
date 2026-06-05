import { LandingHeader } from "@/components/landing/header";
import { LandingHero } from "@/components/landing/hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingIntegrations } from "@/components/landing/integrations";
import { LandingPricing } from "@/components/landing/pricing";
import { LandingFAQ } from "@/components/landing/faq";
import { LandingFooter } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingIntegrations />
        <LandingPricing />
        <LandingFAQ />
      </main>
      <LandingFooter />
    </div>
  );
}
