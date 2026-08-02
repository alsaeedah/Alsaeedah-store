// Global Error Handler - Must be imported first
console.log('[Startup] [1] Android Started / Error Handler Initializing');

window.onerror = function(message, source, lineno, colno, error) {
  console.error('[Startup] Global Error Caught:', { message, source, lineno, colno, error });
  renderDiagnosticScreen(message, error?.stack || 'No stack trace');
  return true; // prevent default browser behavior
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('[Startup] Unhandled Promise Rejection Caught:', event.reason);
  renderDiagnosticScreen(
    event.reason?.message || 'Promise Rejection', 
    event.reason?.stack || JSON.stringify(event.reason)
  );
});

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
