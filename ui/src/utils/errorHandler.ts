/**
 * Global error handler to suppress expected errors in Web3 applications
 * These errors are common with wallet extensions and don't affect functionality
 */

export function setupErrorHandlers() {
  if (typeof window === 'undefined') return;

  // Suppress "message port closed" errors - common with wallet extensions
  const originalError = console.error;
  const originalWarn = console.warn;

  const isExpectedError = (message: string): boolean => {
    return (
      message.includes('message port closed') ||
      message.includes('The message port closed') ||
      message.includes('Extension context invalidated') ||
      message.includes('Receiving end does not exist') ||
      message.includes('Could not establish connection')
    );
  };

  // Override console.error
  console.error = (...args: any[]) => {
    const message = args.map(String).join(' ');
    if (isExpectedError(message)) {
      // Silently ignore expected errors
      return;
    }
    originalError.apply(console, args);
  };

  // Override console.warn
  console.warn = (...args: any[]) => {
    const message = args.map(String).join(' ');
    if (isExpectedError(message)) {
      // Silently ignore expected errors
      return;
    }
    originalWarn.apply(console, args);
  };

  // Global error event listener
  window.addEventListener(
    'error',
    (event) => {
      const message = event.message || String(event.error || '');
      if (isExpectedError(message)) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    },
    true
  );

  // Global unhandled promise rejection handler
  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const message =
        event.reason?.message ||
        String(event.reason) ||
        String(event);
      if (isExpectedError(message)) {
        event.preventDefault();
        return false;
      }
    },
    true
  );
}

