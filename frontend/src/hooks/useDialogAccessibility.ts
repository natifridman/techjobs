import { useEffect, useRef, useCallback, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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

      const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
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

  // Focus trap
  useFocusTrap(dialogRef, isOpen);

  // Escape key handling
  useEscapeKey(isOpen, onClose, triggerRef);

  // Auto-focus dialog
  useAutoFocus(dialogRef, isOpen, focusDelay);

  // Close and return focus helper
  const closeAndReturnFocus = useCallback(() => {
    onClose();
    triggerRef.current?.focus();
  }, [onClose]);

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
