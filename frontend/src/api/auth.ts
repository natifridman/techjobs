// Authentication API client

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '');

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface AuthState {
  authenticated: boolean;
  user: User | null;
}

export const authApi = {
  // Get current user
  getMe: async (): Promise<AuthState> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        return { authenticated: false, user: null };
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching auth state:', error);
      return { authenticated: false, user: null };
    }
  },

  // Get Google login URL
  getLoginUrl: (redirectUrl?: string): string => {
    const redirect = redirectUrl || window.location.href;
    return `${API_BASE_URL}/auth/google?redirect=${encodeURIComponent(redirect)}`;
  },

  // Logout
  logout: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      return response.ok;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }
};
