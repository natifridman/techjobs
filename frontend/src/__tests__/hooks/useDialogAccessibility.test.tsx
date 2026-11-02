import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDialogAccessibility } from '@/hooks/useDialogAccessibility';

function DialogHarness() {
  const [open, setOpen] = useState(false);
  const { dialogRef, triggerRef, closeAndReturnFocus } = useDialogAccessibility({ isOpen: open, onClose: () => setOpen(false) });
  return <div>
    <button ref={triggerRef} onClick={() => setOpen(true)}>Open dialog</button>
    <button data-testid="background">Background</button>
    {open && <div ref={dialogRef} role="dialog" tabIndex={-1}>
      <button disabled>Disabled first</button>
      <button hidden>Hidden</button>
      <button>First enabled</button>
      <button onClick={closeAndReturnFocus}>Close dialog</button>
    </div>}
  </div>;
}

describe('dialog accessibility', () => {
  it('wraps initial Shift+Tab to the last enabled control and Tab to the first', () => {
    render(<DialogHarness />);
    fireEvent.click(screen.getByText('Open dialog'));
    const dialog = screen.getByRole('dialog');
    dialog.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByText('Close dialog')).toHaveFocus();
    dialog.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByText('First enabled')).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByText('Close dialog')).toHaveFocus();
  });

  it('inerts background, redirects escaped focus, and restores state after close', () => {
    render(<DialogHarness />);
    const background = screen.getByTestId('background');
    fireEvent.click(screen.getByText('Open dialog'));
    expect(background.inert).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    background.focus();
    expect(screen.getByText('First enabled')).toHaveFocus();
    fireEvent.click(screen.getByText('Close dialog'));
    expect(background.inert).toBeFalsy();
    expect(document.body.style.overflow).toBe('');
    expect(screen.getByText('Open dialog')).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', () => {
    render(<DialogHarness />);
    fireEvent.click(screen.getByText('Open dialog'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Open dialog')).toHaveFocus();
  });
});
