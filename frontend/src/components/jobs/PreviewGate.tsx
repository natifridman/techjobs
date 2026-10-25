import { useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { jobsContinuationUrl } from './jobsNavigation';

interface PreviewGateProps { total: number; }

export default function PreviewGate({ total }: PreviewGateProps) {
  const { login } = useAuth();
  const posthog = usePostHog();
  useEffect(() => { posthog.capture('jobs_preview_shown', { matching_jobs: total }); }, [posthog, total]);
  return (
    <section className="rounded-xl border border-iris-200 bg-iris-50 p-6 sm:p-8 text-center" aria-labelledby="preview-gate-title">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-iris-700"><LockKeyhole className="h-5 w-5" aria-hidden="true" /></div>
      <h2 id="preview-gate-title" className="text-xl font-semibold text-warm-900">Keep exploring Israeli tech jobs</h2>
      <p className="mt-2 text-sm leading-6 text-warm-600">Sign in to see all {total.toLocaleString()} matching jobs and sync your saved jobs.</p>
      <Button onClick={() => { posthog.capture('jobs_preview_sign_in_clicked', { matching_jobs: total }); login(jobsContinuationUrl()); }} className="mt-5 gap-2 bg-iris-700 hover:bg-iris-800 text-white">Continue with Google<ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
      <p className="mt-3 text-xs text-warm-500">Your saved jobs stay on this device until you sign in.</p>
    </section>
  );
}
