import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LayoutHeader from '@/components/LayoutHeader';
import { toast } from 'sonner';

const auth = vi.hoisted(() => ({ login: vi.fn(), logout: vi.fn(), isAuthenticated: false, isLoading: false, user: null as null | { name: string; email: string } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  auth.isAuthenticated = false; auth.user = null;
  auth.logout.mockResolvedValue(undefined);
});
function renderHeader() { render(<MemoryRouter><LayoutHeader /></MemoryRouter>); }
describe('global header', () => {
  it('keeps sign in directly available and preserves the current destination', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    expect(auth.login).toHaveBeenCalledWith(window.location.href);
  });
  it('opens navigation and restores focus when the drawer closes', async () => {
    const user = userEvent.setup(); renderHeader();
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Navigation menu' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
    await user.click(screen.getByRole('button', { name: 'Close navigation menu' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(document.body.style.overflow).toBe('');
  });
  it('opens accessibility controls from the header and persists settings', async () => {
    const user = userEvent.setup(); renderHeader();
    await user.click(screen.getByRole('button', { name: 'Accessibility settings' }));
    expect(screen.getByRole('dialog', { name: 'Accessibility settings' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Increase text size' }));
    expect(document.documentElement.style.fontSize).toBe('110%');
    expect(JSON.parse(localStorage.getItem('accessibility-settings') || '{}').fontSize).toBe(110);
    await user.click(screen.getByRole('button', { name: 'Reset all accessibility settings' }));
    expect(document.documentElement.style.fontSize).toBe('100%');
  });
  it('reports failed logout while retaining account controls', async () => {
    auth.isAuthenticated = true; auth.user = { name: 'Test User', email: 'test@example.com' };
    auth.logout.mockRejectedValue(new Error('offline')); renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not sign out. Please try again.'));
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled();
  });
});
