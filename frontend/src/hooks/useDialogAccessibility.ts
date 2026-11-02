import { useEffect, useRef, useCallback, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(element => {
    if (element.tabIndex < 0 || element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true' || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    let current: HTMLElement | null = element;
    while (current && current !== container.parentElement) {
      const style = window.getComputedStyle(current);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      current = current.parentElement;
    }
    return true;
  });
}


/**
 * Hook to handle focus trapping within a container element.
 * Keeps Tab/Shift+Tab cycling within the container when active.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const elements = focusableElements(container);
      if (elements.length === 0) { e.preventDefault(); container.focus(); return; }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      const focusIsOutsideControls = !elements.includes(document.activeElement as HTMLElement);

      if (e.shiftKey && (document.activeElement === firstElement || focusIsOutsideControls)) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && (document.activeElement === lastElement || focusIsOutsideControls)) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    const handleFocus = (event: FocusEvent) => {
      const container = containerRef.current;
      if (container && event.target instanceof Node && !container.contains(event.target)) {
        (focusableElements(container)[0] || container).focus();
      }
    };
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('focusin', handleFocus);
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('focusin', handleFocus);
    };
  }, [isActive, containerRef]);
}

/**
 * Hook to handle Escape key press to close a dialog/modal.
 * Returns focus to the trigger element when closed.
 */
export function useEscapeKey(
  isActive: boolean,
  onClose: () => void,
  returnFocusRef?: RefObject<HTMLElement | null>
) {
  // Use ref to avoid stale closure issues with onClose
  const onCloseRef = useRef(onClose);
  
  // Update ref in effect to avoid "Cannot update ref during render" error
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        returnFocusRef?.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isActive, returnFocusRef]);
}

/**
 * Hook to auto-focus a container when it becomes active.
 */
export function useAutoFocus(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean,
  delay = 100
) {
  useEffect(() => {
    if (isActive && containerRef.current) {
      const timeoutId = setTimeout(() => containerRef.current?.focus(), delay);
      return () => clearTimeout(timeoutId);
    }
  }, [isActive, containerRef, delay]);
}

interface UseDialogAccessibilityOptions {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Delay before focusing the dialog container (default: 100ms) */
  focusDelay?: number;
}

interface UseDialogAccessibilityReturn {
  /** Ref to attach to the dialog container element */
  dialogRef: RefObject<HTMLDivElement | null>;
  /** Ref to attach to the trigger button that opens the dialog */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** Call this to close the dialog and return focus to trigger */
  closeAndReturnFocus: () => void;
}

/**
 * Combined hook for accessible dialog/modal behavior.
 * Handles:
 * - Focus trapping within the dialog
 * - Escape key to close
 * - Auto-focus dialog on open
 * - Return focus to trigger on close
 * 
 * @example
 * ```tsx
 * const { dialogRef, triggerRef, closeAndReturnFocus } = useDialogAccessibility({
 *   isOpen,
 *   onClose: () => setIsOpen(false),
 * });
 * 
 * return (
 *   <>
 *     <button ref={triggerRef} onClick={() => setIsOpen(true)}>Open</button>
 *     {isOpen && (
 *       <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1}>
 *         <button onClick={closeAndReturnFocus}>Close</button>
 *       </div>
 *     )}
 *   </>
 * );
 * ```
 */
export function useDialogAccessibility({
  isOpen,
  onClose,
  focusDelay = 100,
}: UseDialogAccessibilityOptions): UseDialogAccessibilityReturn {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Inert siblings along the dialog's ancestor path, while keeping its backdrop clickable.
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const changed: Array<{ element: HTMLElement; wasInert: boolean }> = [];
    let branch: HTMLElement = dialogRef.current;
    let parent = branch.parentElement;
    while (parent) {
      for (const sibling of Array.from(parent.children)) {
        if (sibling === branch || !(sibling instanceof HTMLElement) || sibling.getAttribute('aria-hidden') === 'true') continue;
        changed.push({ element: sibling, wasInert: sibling.inert });
        sibling.inert = true;
      }
      if (parent === document.body) break;
      branch = parent;
      parent = parent.parentElement;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      changed.forEach(({ element, wasInert }) => { element.inert = wasInert; });
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Focus trap
  useFocusTrap(dialogRef, isOpen);

  // Escape key handling
  useEscapeKey(isOpen, onClose, triggerRef);

  // Auto-focus dialog
  useAutoFocus(dialogRef, isOpen, focusDelay);

  // Close and return focus helper
  const closeAndReturnFocus = useCallback(() => {
    onClose();
  }, [onClose]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (!isOpen && wasOpen.current && triggerRef.current && window.getComputedStyle(triggerRef.current).display !== 'none') triggerRef.current.focus();
    wasOpen.current = isOpen;
  }, [isOpen]);

  return {
    dialogRef,
    triggerRef,
    closeAndReturnFocus,
  };
}

/**
 * Hook for mobile-specific dialog behavior that also tracks
 * the previously focused element before opening.
 */
export function useMobileDialogAccessibility({
  isOpen,
  isMobile,
  onClose,
  focusDelay = 100,
}: UseDialogAccessibilityOptions & { isMobile: boolean }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);
  
  // Use ref to avoid stale closure issues with onClose
  const onCloseRef = useRef(onClose);
  
  // Update ref in effect to avoid "Cannot update ref during render" error
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Store the element that was focused when opening
  useEffect(() => {
    if (isOpen && isMobile) {
      previousActiveElement.current = document.activeElement;
    }
  }, [isOpen, isMobile]);

  // Focus trap (only when mobile)
  useFocusTrap(dialogRef, isOpen && isMobile);

  // Escape key handling with return focus to previous element
  useEffect(() => {
    if (!isOpen || !isMobile) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        (previousActiveElement.current as HTMLElement)?.focus?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isMobile]); // onClose removed from deps - using ref instead

  // Auto-focus dialog
  useEffect(() => {
    if (isOpen && isMobile && dialogRef.current) {
      const timeoutId = setTimeout(() => dialogRef.current?.focus(), focusDelay);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isMobile, focusDelay]);

  // Restore focus when dialog closes
  useEffect(() => {
    if (!isOpen && isMobile && previousActiveElement.current) {
      (previousActiveElement.current as HTMLElement)?.focus?.();
    }
  }, [isOpen, isMobile]);

  return {
    dialogRef,
    previousActiveElement,
  };
}
