import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/header";
import { LandingHero } from "@/components/landing/hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingIntegrations } from "@/components/landing/integrations";
import { LandingPricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { TrustBadges } from "@/components/landing/trust-badges";
import { LandingFAQ } from "@/components/landing/faq";
import { Blog } from "@/components/landing/blog";
import { AppStore } from "@/components/landing/app-store";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Qoyod - Cloud Accounting Software | ZATCA Compliant",
  description: "Enterprise cloud accounting software for Saudi businesses. ZATCA e-invoicing, financial reports, inventory management, and more.",
  openGraph: {
    title: "Qoyod - Cloud Accounting Software",
    description: "Manage your finances with ease. ZATCA compliant cloud accounting for Saudi businesses.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <LandingHeader />
      <main>
        <LandingHero />
        <TrustBadges />
        <LandingFeatures />
        <LandingIntegrations />
        <LandingPricing />
        <Testimonials />
        <Blog />
        <AppStore />
        <LandingFAQ />
      </main>
      <LandingFooter />
    </div>
  );
}
