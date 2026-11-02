import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/components/ThemeProvider';
import ThemeSwitcher from '@/components/ThemeSwitcher';

afterEach(() => { vi.restoreAllMocks(); });

describe('desktop theme switcher', () => {
  it('supports opening, selecting and returning focus with the keyboard', async () => {
    localStorage.clear();
    const scrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = vi.fn();
    const user = userEvent.setup();
    try {
      render(<ThemeProvider><ThemeSwitcher compact /></ThemeProvider>);
      const trigger = screen.getByRole('combobox', { name: 'Color theme: System' });
      await user.tab();
      expect(trigger).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      await user.keyboard('{Home}{ArrowDown}{Enter}');
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
      expect(trigger).toHaveAccessibleName('Color theme: Dark');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      expect(localStorage.getItem('techjobs-theme')).toBe('dark');
    } finally {
      HTMLElement.prototype.scrollIntoView = scrollIntoView;
    }
  });
});
