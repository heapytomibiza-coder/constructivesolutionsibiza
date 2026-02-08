import { useEffect, useCallback } from "react";

/**
 * Global keyboard shortcut for search (⌘K on Mac, Ctrl+K on Windows/Linux)
 * 
 * Features:
 * - Platform-aware (⌘K on Mac, Ctrl+K on Windows/Linux)
 * - Ignores when user is typing in input/textarea
 * - Prevents default browser behavior (Ctrl+K = address bar in some browsers)
 */
export function useGlobalSearchShortcut(onOpen: () => void) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isK = e.key.toLowerCase() === "k";
    // Accept BOTH meta and ctrl - works on all platforms without guessing
    const isCombo = (e.metaKey || e.ctrlKey) && isK;

    if (!isCombo) return;

    // Don't trigger when typing in input fields
    const target = e.target as HTMLElement | null;
    const tagName = target?.tagName?.toLowerCase();
    const isTypingField =
      tagName === "input" ||
      tagName === "textarea" ||
      target?.isContentEditable === true;

    if (isTypingField) return;

    e.preventDefault();
    onOpen();
  }, [onOpen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
