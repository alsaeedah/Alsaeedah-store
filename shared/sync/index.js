import { syncCoordinator } from './SyncCoordinator.js';

/**
 * Single-flight state for bootstrap synchronization.
 * 
 * bootstrapPromise — shared in-flight Promise for concurrent callers.
 *   Cleared in a `finally` block so failed bootstraps can be retried.
 * 
 * bootstrapped — permanent success flag.
 *   Once bootstrap has completed successfully, future calls are no-ops.
 *   This is separate from bootstrapPromise so that:
 *     - Concurrent callers share the same Promise (bootstrapPromise handles this).
 *     - Sequential post-success callers return immediately (bootstrapped handles this).
 */
let bootstrapPromise = null;
let bootstrapped = false;

const _doBootstrap = async (db, auth) => {
    console.log('[Sync] Bootstrap starting.');

    // Adapters are already registered idempotently via SyncCoordinator.initialize() in main.jsx.
    // Trigger initial synchronization across all registered adapters.
    // Errors are isolated per adapter inside syncAll() — this call will not throw.
    await syncCoordinator.syncAll();

    console.log('[Sync] Bootstrap completed.');
};

/**
 * bootstrapSyncOnce — Single-flight bootstrap synchronization.
 * 
 * Guarantees:
 *  - Exactly one bootstrap execution even if called concurrently.
 *  - Both callers share the same in-flight Promise.
 *  - After successful completion, future calls are immediate no-ops.
 *  - After failure, the Promise is cleared (via `finally`) so a retry is possible.
 * 
 * Call site: StartupProvider, after Background Validation succeeds and
 *            syncCoordinator.markReady() has been called.
 * 
 * @param {object} db - Firestore DB instance.
 * @param {object} auth - Firebase Auth instance.
 * @returns {Promise<void>}
 */
export const bootstrapSyncOnce = (db, auth) => {
    if (bootstrapped) {
        console.log('[Sync] Bootstrap already completed. Skipping.');
        return Promise.resolve();
    }

    if (bootstrapPromise) {
        console.log('[Sync] Bootstrap already running — reusing existing promise.');
        return bootstrapPromise;
    }

    bootstrapPromise = _doBootstrap(db, auth)
        .then(() => {
            bootstrapped = true;
        })
        .finally(() => {
            // Always clear so a failed bootstrap can be retried.
            bootstrapPromise = null;
        });

    return bootstrapPromise;
};

export { syncCoordinator };
