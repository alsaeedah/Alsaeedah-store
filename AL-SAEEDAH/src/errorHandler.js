// Global Error Handler - Must be imported first
console.log('[Startup] [1] Android Started / Error Handler Initializing');

// ---------------------------------------------------------------------------
// Inline recoverable-error classification.
// Kept inline (not imported) so this module has zero import-time side effects
// and no circular dependencies. Mirrors the logic in shared/errors/errorClassifier.js.
//
// Policy: safe-default = NOT recoverable.
// Only explicitly known/reliably identified errors are classified as recoverable.
// Unknown errors are never suppressed.
// ---------------------------------------------------------------------------
const RECOVERABLE_FIREBASE_CODES = new Set([
    'unavailable',
    'deadline-exceeded',
    'cancelled',
    'network-request-failed',
    'resource-exhausted',
]);

function _isRecoverableError(error) {
    if (!error) return false;

    // 1. Explicit application-defined error types (highest reliability)
    if (error.name === 'OfflineError') return true;
    if (error.name === 'AbortError') return true;

    // 2. Firebase / Firestore structural error codes
    const code = typeof error.code === 'string' ? error.code : '';
    if (code && RECOVERABLE_FIREBASE_CODES.has(code)) return true;

    // 3. Last-resort: exact message match for the one controlled throw
    //    in FirestoreProductRepository._safeGetDocs()
    const msg = typeof error.message === 'string' ? error.message : '';
    if (msg === 'Offline cache miss. Preserving LKG data.') return true;

    return false;
}

// ---------------------------------------------------------------------------
// window.onerror — synchronous / script errors
// ---------------------------------------------------------------------------
window.onerror = function(message, source, lineno, colno, error) {
    if (_isRecoverableError(error)) {
        // Recoverable: log diagnostically, do NOT show fatal screen.
        console.warn('[ErrorHandler] Recoverable global error suppressed (no fatal screen):', {
            message, source, lineno, colno, error
        });
        return true; // prevent browser default
    }

    // Unexpected / unknown: preserve existing fatal diagnostic behavior.
    console.error('[Startup] Global Error Caught:', { message, source, lineno, colno, error });
    renderDiagnosticScreen(message, error?.stack || 'No stack trace');
    return true;
};

// ---------------------------------------------------------------------------
// window.unhandledrejection — rejected Promises without a .catch() owner
// ---------------------------------------------------------------------------
window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason;

    if (_isRecoverableError(reason)) {
        // Recoverable: log diagnostically, prevent the fatal screen.
        console.warn('[ErrorHandler] Recoverable unhandled rejection suppressed (no fatal screen):', reason);
        event.preventDefault(); // absorb so browser/Capacitor do not escalate
        return;
    }

    // Unexpected / unknown: preserve existing fatal diagnostic behavior.
    console.error('[Startup] Unhandled Promise Rejection Caught:', reason);
    renderDiagnosticScreen(
        reason?.message || 'Promise Rejection',
        reason?.stack || JSON.stringify(reason)
    );
});

// ---------------------------------------------------------------------------
// Fatal diagnostic screen — unchanged from original
// ---------------------------------------------------------------------------
function renderDiagnosticScreen(title, details) {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `
      <div style="padding: 20px; font-family: monospace; color: white; background-color: #990000; min-height: 100vh; word-break: break-all;">
        <h2>Startup Fatal Error</h2>
        <p><strong>Message:</strong> ${title}</p>
        <p><strong>Stack:</strong></p>
        <pre style="white-space: pre-wrap; font-size: 12px; background: rgba(0,0,0,0.2); padding: 10px;">${details}</pre>
        <p style="margin-top:20px; font-size:12px;">This is a diagnostic screen to prevent the 'gray screen' issue. Please report this error.</p>
      </div>
    `;
    }

    // Hide splash screen so the error is visible
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) {
        window.Capacitor.Plugins.SplashScreen.hide();
    }
}

console.log('[Startup] [2] Global Error Handlers Ready');
