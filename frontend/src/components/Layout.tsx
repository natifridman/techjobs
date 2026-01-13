import type { ReactNode } from 'react';
import LayoutHeader from "@/components/LayoutHeader";
import { BannerAd } from "@/components/GoogleAd";

interface LayoutProps {
  children: ReactNode;
  currentPageName: string;
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  const isHomePage = currentPageName === 'Home';

  // Home page uses dark header variant over hero
  if (isHomePage) {
    return (
      <div className="relative">
        {/* Dark header positioned absolutely over hero */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <LayoutHeader variant="dark" />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <LayoutHeader variant="light" />
      {/* Top banner ad */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <BannerAd />
      </div>
      {children}
    </div>
  );
}
