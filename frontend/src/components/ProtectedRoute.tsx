import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Lock, LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-50 to-iris-50/30 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-iris-200 rounded-full" />
          <div className="h-4 w-32 bg-iris-200 rounded" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-50 to-iris-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-iris-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-iris-600" />
          </div>
          <h1 className="text-2xl font-bold text-warm-900 mb-3">
            Login Required
          </h1>
          <p className="text-warm-600 mb-8">
            Please sign in to access the job listings and discover opportunities at Israel's top tech companies.
          </p>
          <Button
            onClick={() => login(window.location.href)}
            className="w-full bg-iris-600 hover:bg-iris-700 text-white py-6 text-lg rounded-xl"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In with Google
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
