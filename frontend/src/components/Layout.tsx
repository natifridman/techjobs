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
      <aside aria-label="Support TechJobsIL" className="border-b border-iris-200 bg-iris-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 text-center">
          <p className="text-sm font-medium text-ink">Help support TechJobsIL</p>
          <nav aria-label="Support options" className="flex items-center gap-2">
            <a href="https://patreon.com/techjobsil?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink" target="_blank" rel="noopener noreferrer" aria-label="Support on Patreon (opens in a new tab)" title="Support on Patreon (opens in a new tab)" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-iris-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><img src="/support/patreon.png" alt="" aria-hidden="true" width="32" height="32" className="h-7 w-7 object-contain" /></a>
            <a href="https://links.payboxapp.com/TnBXfergL7b" target="_blank" rel="noopener noreferrer" aria-label="Support on PayBox (opens in a new tab)" title="Support on PayBox (opens in a new tab)" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-iris-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><img src="/support/paybox.png" alt="" aria-hidden="true" width="32" height="32" className="h-8 w-8 object-contain" /></a>
            <a href="https://www.bitpay.co.il/app/share-info?i=Viz91wbl&amp;j=true" target="_blank" rel="noopener noreferrer" aria-label="Support on Bit (opens in a new tab)" title="Support on Bit (opens in a new tab)" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-iris-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><img src="/support/bit.jpg" alt="" aria-hidden="true" width="32" height="32" className="h-8 w-8 rounded-lg object-contain" /></a>
          </nav>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <BannerAd />
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">© {new Date().getFullYear()} TechJobsIL · Opportunities in Israeli tech</p>
          <nav className="flex flex-wrap gap-x-5" aria-label="Footer">
            <a href="https://patreon.com/techjobsil?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink" target="_blank" rel="noopener noreferrer" aria-label="Support TechJobsIL on Patreon (opens in a new tab)" title="Support on Patreon (opens in a new tab)" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-iris-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><img src="/support/patreon.png" alt="" aria-hidden="true" width="32" height="32" className="h-7 w-7 object-contain" /></a>
            <a href="https://links.payboxapp.com/TnBXfergL7b" target="_blank" rel="noopener noreferrer" aria-label="Support TechJobsIL on PayBox (opens in a new tab)" title="Support on PayBox (opens in a new tab)" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-iris-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><img src="/support/paybox.png" alt="" aria-hidden="true" width="32" height="32" className="h-8 w-8 object-contain" /></a>
            <a href="https://www.bitpay.co.il/app/share-info?i=Viz91wbl&amp;j=true" target="_blank" rel="noopener noreferrer" aria-label="Support TechJobsIL on Bit (opens in a new tab)" title="Support on Bit (opens in a new tab)" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-iris-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><img src="/support/bit.jpg" alt="" aria-hidden="true" width="32" height="32" className="h-8 w-8 rounded-lg object-contain" /></a>
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
