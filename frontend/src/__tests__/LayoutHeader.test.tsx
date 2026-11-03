import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LayoutHeader from '@/components/LayoutHeader';
import { ThemeProvider } from '@/components/ThemeProvider';
import { toast } from 'sonner';

const auth = vi.hoisted(() => ({ login: vi.fn(), logout: vi.fn(), isAuthenticated: false, isLoading: false, user: null as null | { name: string; email: string } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  auth.isAuthenticated = false; auth.isLoading = false; auth.user = null;
  auth.logout.mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());
function CurrentPath() {
  const { pathname } = useLocation();
  return <output aria-label="Current path">{pathname}</output>;
}
function renderHeader() { render(<ThemeProvider><MemoryRouter><LayoutHeader /><CurrentPath /></MemoryRouter></ThemeProvider>); }
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
  it('keeps keyboard focus inside the drawer and restores it after Escape', async () => {
    const user = userEvent.setup(); renderHeader();
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Navigation menu' });
    await waitFor(() => expect(dialog).toHaveFocus());
    const close = within(dialog).getByRole('button', { name: 'Close navigation menu' });
    const lastLink = within(dialog).getByRole('link', { name: 'Accessibility statement' });
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(lastLink).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.body.style.overflow).toBe('');
  });
  it('dismisses navigation from its backdrop and restores focus', async () => {
    const user = userEvent.setup(); renderHeader();
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Navigation menu' });
    await user.click(dialog.previousElementSibling as HTMLElement);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
  it.each([
    ['Jobs', '/jobs'], ['Companies', '/companies'], ['Saved', '/saved'],
    ['Map', '/map'], ['Accessibility statement', '/accessibility'],
  ])('navigates to %s and closes the drawer', async (name, path) => {
    const user = userEvent.setup(); renderHeader();
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Navigation menu' });
    await user.click(within(dialog).getByRole('link', { name }));
    expect(screen.getByRole('status', { name: 'Current path' })).toHaveTextContent(path);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
  it('closes navigation and releases the scroll lock at the desktop breakpoint', async () => {
    const desktopMedia = {
      ...window.matchMedia('(min-width: 768px)'),
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const originalMatchMedia = window.matchMedia;
    vi.spyOn(window, 'matchMedia').mockImplementation(query =>
      query === '(min-width: 768px)' ? desktopMedia : originalMatchMedia(query));
    const user = userEvent.setup();
    const { unmount } = render(<ThemeProvider><MemoryRouter><LayoutHeader /></MemoryRouter></ThemeProvider>);
    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(document.body.style.overflow).toBe('hidden');
    const closeOnDesktop = desktopMedia.addEventListener.mock.calls[0][1];
    act(() => { desktopMedia.matches = true; closeOnDesktop(); });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    unmount();
    expect(desktopMedia.removeEventListener).toHaveBeenCalledWith('change', closeOnDesktop);
  });
  it('closes nested accessibility controls before closing navigation', async () => {
    const user = userEvent.setup(); renderHeader();
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await user.click(trigger);
    const navigation = screen.getByRole('dialog', { name: 'Navigation menu' });
    const settingsTrigger = within(navigation).getByRole('button', { name: 'Accessibility settings' });
    await user.click(settingsTrigger);
    const settings = screen.getByRole('dialog', { name: 'Accessibility settings' });
    await waitFor(() => expect(settings).toHaveFocus());
    await user.tab();
    expect(settings).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Accessibility settings' })).not.toBeInTheDocument();
    expect(navigation).toBeInTheDocument();
    expect(settingsTrigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
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
  it('offers keyboard-accessible color themes in the mobile navigation drawer', async () => {
    const user = userEvent.setup(); renderHeader();
    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const dark = screen.getByRole('radio', { name: 'Dark' });
    await user.click(dark);
    expect(dark).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('techjobs-theme')).toBe('dark');
    dark.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    expect(localStorage.getItem('techjobs-theme')).toBe('system');
  });
  it('reports failed logout while retaining account controls', async () => {
    auth.isAuthenticated = true; auth.user = { name: 'Test User', email: 'test@example.com' };
    auth.logout.mockRejectedValue(new Error('offline')); renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not sign out. Please try again.'));
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled();
  });
});
