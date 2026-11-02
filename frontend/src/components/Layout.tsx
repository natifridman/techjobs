import { useState, type ReactNode } from 'react';
import AddCompanyModal from '@/components/AddCompanyModal';
import { Link } from 'react-router-dom';
import LayoutHeader from '@/components/LayoutHeader';
import { BannerAd } from '@/components/GoogleAd';

interface LayoutProps { children: ReactNode; currentPageName?: string }

export default function Layout({ children }: LayoutProps) {
  const [suggesting, setSuggesting] = useState(false);
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <LayoutHeader />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <BannerAd />
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">© {new Date().getFullYear()} TechJobsIL · Opportunities in Israeli tech</p>
          <nav className="flex flex-wrap gap-x-5" aria-label="Footer">
            <a href="https://patreon.com/techjobsil?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink" target="_blank" rel="noopener noreferrer" aria-label="Support TechJobsIL on Patreon (opens in a new tab)" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-primary hover:underline">
              Support TechJobsIL on Patreon<span className="sr-only"> (opens in a new tab)</span><span aria-hidden="true">↗</span>
            </a>
            <button type="button" onClick={() => setSuggesting(true)} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-primary">Suggest a company</button>
            <Link to="/privacy" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-primary">Privacy</Link>
            <Link to="/terms" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-primary">Terms</Link>
            <Link to="/accessibility" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-primary">Accessibility</Link>
          </nav>
        </div>
      </footer>
      <AddCompanyModal open={suggesting} onOpenChange={setSuggesting} />
    </div>
  );
}
