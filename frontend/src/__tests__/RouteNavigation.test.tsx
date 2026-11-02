import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RouteNavigation from '@/components/RouteNavigation';
function Navigation() {
  const navigate = useNavigate();
  return (
    <>
      <RouteNavigation />
      <main id="main-content" tabIndex={-1}>
        <button onClick={() => navigate('/companies')}>Companies</button>
        <button onClick={() => navigate('/jobs?category=software')}>Filter</button>
        <button onClick={() => navigate(-1)}>Back</button>
      </main>
    </>
  );
}
beforeEach(() => {
  vi.mocked(window.scrollTo).mockClear();
  Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
});
afterEach(() => {
  Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
});
describe('route scroll and focus', () => {
  it('opens a new page at the top and restores the previous position on Back', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <Navigation />
      </MemoryRouter>,
    );
    act(() => {
      window.scrollY = 500;
      fireEvent.scroll(window);
    });
    await user.click(screen.getByRole('button', { name: 'Companies' }));
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });
    expect(document.getElementById('main-content')).toHaveFocus();
    act(() => {
      window.scrollY = 100;
      fireEvent.scroll(window);
    });
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 500, behavior: 'instant' });
  });
  it('keeps scroll and input focus when only filters change', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <Navigation />
      </MemoryRouter>,
    );
    vi.mocked(window.scrollTo).mockClear();
    act(() => {
      window.scrollY = 350;
      fireEvent.scroll(window);
    });
    const filter = screen.getByRole('button', { name: 'Filter' });
    await user.click(filter);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(filter).toHaveFocus();
  });
});
