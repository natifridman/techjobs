import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Surfaces a failed Google sign-in. When OAuth fails (e.g. the user denies
// consent or Google errors), the backend redirects back to the app with
// ?authError=1 instead of leaving the user on a bare JSON error page. Show
// a toast once and strip the param so a refresh does not re-fire it.
export default function AuthErrorToast() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (!searchParams.has('authError')) return;
    toast.error('Sign-in failed. Please try again.');
    const next = new URLSearchParams(searchParams);
    next.delete('authError');
    navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { replace: true });
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
}
