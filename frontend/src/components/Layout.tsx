import type { ReactNode } from 'react';
import LayoutHeader from "@/components/LayoutHeader";

interface LayoutProps {
  children: ReactNode;
  currentPageName: string;
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  const isHomePage = currentPageName === 'Home';

  // Home page handles its own header
  if (isHomePage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <LayoutHeader />
      {children}
    </div>
  );
}
