import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const KEY = 'techjobs_guest_browsing_time_v1';
export const GUEST_ALLOWANCE_MS = 30_000;
const BROWSING_ROUTES = new Set(['/', '/jobs', '/companies', '/company', '/companyprofile', '/saved', '/map']);
let memoryElapsed = 0;
function readElapsed(): number {
  try {
    const value = Number(sessionStorage.getItem(KEY));
    return Number.isFinite(value) && value >= 0 ? Math.min(value, GUEST_ALLOWANCE_MS) : 0;
  } catch { return memoryElapsed; }
}
function saveElapsed(value: number) {
  memoryElapsed = Math.max(0, Math.min(value, GUEST_ALLOWANCE_MS));
  try { sessionStorage.setItem(KEY, String(memoryElapsed)); } catch { /* Storage can be disabled. */ }
}
export default function TimedSignInGate() {
  const auth = useAuth();
  const { pathname, key } = useLocation();
  const browsing = BROWSING_ROUTES.has(pathname.toLowerCase().replace(/\/+$/, '') || '/');
  const guest = !auth.isLoading && !auth.isUnavailable && !auth.isAuthenticated;
  const entry = `${key}:${guest}:${browsing}`;
  const [prepared, setPrepared] = useState({ entry, expired: false });
  // A return navigation or auth transition is a new opening. Never reuse a
  // previous opening's permission to mount before existing traps are released.
  if (prepared.entry !== entry) setPrepared({ entry, expired: false });
  useEffect(() => {
    if (!guest || !browsing) return;
    let elapsed = readElapsed();
    let activeSince: number | null = null;
    let timer: number | undefined;
    const pause = () => {
      if (activeSince !== null) {
        elapsed += Math.max(0, performance.now() - activeSince);
        activeSince = null;
        saveElapsed(elapsed);
      }
      window.clearTimeout(timer);
    };
    const expire = () => {
      // Release custom modal focus traps and inert siblings before Radix mounts.
      flushSync(() => window.dispatchEvent(new Event('techjobs:mandatory-signin')));
      setPrepared({ entry, expired: true });
    };
    const resume = () => {
      if (activeSince !== null || document.visibilityState === 'hidden') return;
      if (elapsed >= GUEST_ALLOWANCE_MS) { timer = window.setTimeout(expire, 0); return; }
      activeSince = performance.now();
      timer = window.setTimeout(() => {
        elapsed = GUEST_ALLOWANCE_MS;
        activeSince = null;
        saveElapsed(elapsed);
        expire();
      }, Math.max(0, GUEST_ALLOWANCE_MS - elapsed));
    };
    const visibility = () => { if (document.visibilityState === 'hidden') pause(); else resume(); };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', pause);
    window.addEventListener('pageshow', resume);
    resume();
    return () => {
      pause();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', pause);
      window.removeEventListener('pageshow', resume);
    };
  }, [guest, browsing, pathname, entry]);
  const open = guest && browsing && prepared.entry === entry && prepared.expired;
  return <Dialog.Root open={open}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-sm" />
      <Dialog.Content onEscapeKeyDown={event => event.preventDefault()} onPointerDownOutside={event => event.preventDefault()} onInteractOutside={event => event.preventDefault()} className="fixed left-1/2 top-1/2 z-[201] w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 text-center text-ink shadow-xl sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-iris-50 text-primary"><LockKeyhole aria-hidden="true" className="h-6 w-6" /></div>
        <Dialog.Title className="text-2xl font-semibold">Sign in to keep exploring</Dialog.Title>
        <Dialog.Description className="mt-3 text-sm leading-6 text-muted">Your guest preview has ended. Continue with Google to browse all matching jobs and sync your saved jobs across devices.</Dialog.Description>
        <Button className="mt-6 h-auto min-h-11 w-full whitespace-normal py-3 leading-6" onClick={() => auth.login(window.location.href)}>Continue with Google</Button>
        <p className="mt-3 text-xs text-muted">Your current search will be waiting after sign-in.</p>
        <nav aria-label="Sign-in information" className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted"><Link to="/privacy" className="underline">Privacy</Link><Link to="/terms" className="underline">Terms</Link><Link to="/accessibility" className="underline">Accessibility</Link></nav>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
