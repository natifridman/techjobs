import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AccessibilityWidget from '@/components/AccessibilityWidget';
import { ThemeProvider } from '@/components/ThemeProvider';
import { THEME_STORAGE_KEY } from '@/lib/theme';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(THEME_STORAGE_KEY, 'dark');
});

afterEach(() => {
  document.documentElement.className = '';
  delete document.documentElement.dataset.theme;
  document.documentElement.style.removeProperty('font-size');
  document.documentElement.style.removeProperty('color-scheme');
});

function renderWidget() {
  render(<ThemeProvider><MemoryRouter><AccessibilityWidget /></MemoryRouter></ThemeProvider>);
}

describe('accessibility settings with dark mode', () => {
  it('keeps the selected theme when contrast and other settings are toggled or reset', async () => {
    const user = userEvent.setup();
    renderWidget();
    await user.click(screen.getByRole('button', { name: 'Accessibility settings' }));
    await user.click(screen.getByRole('button', { name: 'High Contrast' }));
    await user.click(screen.getByRole('button', { name: 'Highlight Links' }));
    await user.click(screen.getByRole('button', { name: 'Large Cursor' }));
    await user.click(screen.getByRole('button', { name: 'Increase text size' }));

    expect(document.documentElement).toHaveClass('dark', 'high-contrast', 'highlight-links', 'big-cursor');
    expect(document.documentElement.style.fontSize).toBe('110%');
    expect(screen.getByRole('button', { name: 'High Contrast' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Reset all accessibility settings' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement).not.toHaveClass('high-contrast', 'highlight-links', 'big-cursor');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.fontSize).toBe('100%');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(JSON.parse(localStorage.getItem('accessibility-settings') || '{}')).toEqual({
      fontSize: 100, highContrast: false, highlightLinks: false, bigCursor: false,
    });
  });

  it('restores high contrast independently of the current theme and allows it to be turned off', async () => {
    const user = userEvent.setup();
    localStorage.setItem('accessibility-settings', JSON.stringify({
      fontSize: 120, highContrast: true, highlightLinks: false, bigCursor: false,
    }));
    renderWidget();
    expect(document.documentElement).toHaveClass('dark', 'high-contrast');
    expect(document.documentElement.style.fontSize).toBe('120%');

    await user.click(screen.getByRole('button', { name: 'Accessibility settings' }));
    expect(screen.getByRole('button', { name: 'High Contrast' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'High Contrast' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement).not.toHaveClass('high-contrast');
    expect(document.documentElement.style.fontSize).toBe('120%');
  });

  it('keeps keyboard focus in the panel and restores the trigger on Escape', async () => {
    const user = userEvent.setup();
    renderWidget();
    const trigger = screen.getByRole('button', { name: 'Accessibility settings' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Accessibility settings' });
    await waitFor(() => expect(dialog).toHaveFocus());

    await user.tab({ shift: true });
    expect(screen.getByRole('link', { name: 'Full Accessibility Statement' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close accessibility menu' })).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement).toHaveClass('dark');
  });
});
