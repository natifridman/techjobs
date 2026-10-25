import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, Briefcase, Building2, LogIn, LogOut, MapPin, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import AccessibilityWidget from '@/components/AccessibilityWidget';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useDialogAccessibility } from '@/hooks/useDialogAccessibility';
import { createPageUrl } from '@/utils';

const navLinks = [
  { page: 'Jobs', href: '/jobs', label: 'Jobs', icon: Briefcase },
  { page: 'Companies', href: '/companies', label: 'Companies', icon: Building2 },
  { page: 'SavedJobs', href: '/saved', label: 'Saved', icon: Bookmark },
  { page: 'Map', href: '/map', label: 'Map', icon: MapPin },
];

export default function LayoutHeader() {
  const { pathname } = useLocation();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const { dialogRef, triggerRef, closeAndReturnFocus } = useDialogAccessibility({
    isOpen: isMobileMenuOpen,
    onClose: () => setIsMobileMenuOpen(false),
  });
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => { if (media.matches) setIsMobileMenuOpen(false); };
    closeOnDesktop();
    media.addEventListener('change', closeOnDesktop);
    return () => media.removeEventListener('change', closeOnDesktop);
  }, []);
  const isActive = (href: string) => pathname === href || (href === '/companies' && pathname === '/company');
  const signIn = () => login(window.location.href);
  const signOut = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsMobileMenuOpen(false);
      navigate(createPageUrl('Home'));
    } catch {
      toast.error('Could not sign out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4">
          <Link to="/" className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg" aria-label="TechJobsIL home">
            <img src={resolvedTheme === 'dark' ? '/brand/techjobsil-symbol-white.svg' : '/brand/techjobsil-symbol.svg'} alt="" width="32" height="32" />
            <span className="text-base font-bold tracking-tight text-ink min-[380px]:text-xl">TechJobs<span className="text-primary">IL</span></span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navLinks.map(({ page, href, label, icon: Icon }) => (
              <Button key={page} asChild variant="ghost" size="sm" className={isActive(href) ? 'bg-iris-50 text-primary' : ''}>
                <Link to={createPageUrl(page)} aria-current={isActive(href) ? 'page' : undefined}>
                  <Icon className="mr-2 hidden h-4 w-4 lg:block" aria-hidden="true" />{label}
                </Link>
              </Button>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2" aria-label="Account, appearance and accessibility">
            <div className="hidden md:block"><ThemeSwitcher compact /></div>
            <AccessibilityWidget />
            {isLoading ? (
              <span className="h-11 w-20 animate-pulse rounded-lg bg-warm-100" role="status" aria-label="Loading account" />
            ) : isAuthenticated ? (
              <>
                <span className="hidden max-w-24 truncate text-sm text-muted lg:inline">{user?.name?.split(' ')[0]}</span>
                <Button variant="outline" size="sm" onClick={signOut} disabled={isLoggingOut} aria-label="Sign out">
                  <LogOut className="h-4 w-4 sm:mr-2" aria-hidden="true" /><span className="hidden sm:inline">{isLoggingOut ? 'Signing out…' : 'Sign out'}</span>
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={signIn} aria-label="Sign in with Google"><LogIn className="mr-2 hidden h-4 w-4 lg:block" aria-hidden="true" />Sign in</Button>
            )}
            <Button ref={triggerRef} variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)} aria-label="Open navigation menu" title="Navigation and color theme" aria-expanded={isMobileMenuOpen} aria-controls="mobile-menu">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-slate-900/30" onClick={closeAndReturnFocus} aria-hidden="true" />
          <div ref={dialogRef} id="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu" tabIndex={-1} className="absolute inset-y-0 right-0 flex w-80 max-w-[90vw] flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="font-semibold text-ink">TechJobsIL</span>
              <Button variant="ghost" size="icon" onClick={closeAndReturnFocus} aria-label="Close navigation menu"><X className="h-5 w-5" aria-hidden="true" /></Button>
            </div>
            <ThemeSwitcher />
            <nav className="space-y-2 p-4" aria-label="Mobile navigation">
              {navLinks.map(({ page, href, label, icon: Icon }) => (
                <Link key={page} to={createPageUrl(page)} onClick={closeAndReturnFocus} aria-current={isActive(href) ? 'page' : undefined} className={`flex min-h-12 items-center gap-3 rounded-lg px-4 font-medium ${isActive(href) ? 'bg-iris-50 text-primary' : 'text-muted hover:bg-warm-100'}`}><Icon className="h-5 w-5" aria-hidden="true" />{label}</Link>
              ))}
            </nav>
            <div className="mt-auto space-y-3 border-t border-border p-4 text-sm text-muted">
              {isAuthenticated && <p className="break-words">Signed in as {user?.email || user?.name}</p>}
              <Link to="/accessibility" onClick={closeAndReturnFocus} className="flex min-h-11 items-center rounded-lg px-4 hover:bg-warm-100">Accessibility statement</Link>
              <p className="px-4 text-xs">Text size, contrast and cursor controls are available in the header.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
