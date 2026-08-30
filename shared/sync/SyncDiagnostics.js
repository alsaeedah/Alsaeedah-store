export class SyncDiagnostics {
    static logEvent(feature, action, durationMs, success, errorInfo = null) {
        const event = {
            feature,
            action,
            durationMs,
            success,
            error: errorInfo,
            timestamp: new Date().toISOString()
        };
        
        // Console logging as specified by PRD
        if (success) {
            console.log(`[SyncDiagnostics] ${feature} ${action} completed in ${durationMs}ms`);
        } else {
            console.error(`[SyncDiagnostics] ${feature} ${action} failed after ${durationMs}ms`, errorInfo);
        }
        
        if (typeof localStorage !== 'undefined') {
            try {
                const logs = JSON.parse(localStorage.getItem('AL_SAEEDAH_SYNC_DIAGNOSTICS') || '[]');
                logs.unshift(event);
                if (logs.length > 50) logs.pop(); // Keep last 50 events locally
                localStorage.setItem('AL_SAEEDAH_SYNC_DIAGNOSTICS', JSON.stringify(logs));
            } catch (e) {
                // Ignore storage errors
            }
        }
    }
}
