import type { ReactNode } from 'react';
import LayoutHeader from "@/components/LayoutHeader";
import { BannerAd } from "@/components/GoogleAd";

interface LayoutProps {
  children: ReactNode;
  currentPageName: string;
}

// Skip to main content link for keyboard navigation (accessibility requirement)
function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="skip-to-content"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  const isHomePage = currentPageName === 'Home';

  // Home page uses dark header variant over hero
  if (isHomePage) {
    return (
      <div className="relative">
        <SkipToContent />
        {/* Dark header positioned absolutely over hero */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <LayoutHeader variant="dark" />
        </div>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <SkipToContent />
      <LayoutHeader variant="light" />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      {/* Bottom banner ad */}
      <BannerAd />
    </div>
  );
}
