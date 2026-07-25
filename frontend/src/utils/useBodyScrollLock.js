import { useEffect } from "react";

/**
 * Locks background page scroll while a modal is mounted, and restores the
 * previous overflow value on unmount. Without this, scrolling with the
 * modal open scrolls the page underneath — which can bring page elements
 * like the footer into view instead of staying hidden behind the overlay.
 */
export function useBodyScrollLock() {
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
}
