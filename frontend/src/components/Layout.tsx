import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import LayoutHeader from '@/components/LayoutHeader';
import { BannerAd } from '@/components/GoogleAd';

interface LayoutProps { children: ReactNode; currentPageName: string }

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <LayoutHeader />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <BannerAd />
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">© {new Date().getFullYear()} TechJobsIL · Opportunities in Israeli tech</p>
          <nav className="flex flex-wrap gap-x-5" aria-label="Legal">
            <Link to="/privacy" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-primary">Privacy</Link>
            <Link to="/terms" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-primary">Terms</Link>
            <Link to="/accessibility" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-primary">Accessibility</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
