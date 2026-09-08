/**
 * errorClassifier.js
 *
 * Lightweight, dependency-free error classification utility.
 * Must NOT import React, Firebase, ProductDAL, services, stores,
 * or lifecycle modules. Zero startup side effects.
 *
 * Classification policy:
 *   - Explicitly known / reliably identifiable recoverable errors → recoverable
 *   - Everything else → NOT recoverable (remains observable / fatal)
 *
 * Never broadly classify errors as recoverable.
 * Never rely solely on navigator.onLine (connectivity can change mid-request).
 * Prefer: Error.name > Firebase error.code > message substring (last resort only).
 */

/**
 * Known Firebase/Firestore error codes that indicate a transient connectivity
 * or offline condition. These are NOT programming bugs.
 * @see https://firebase.google.com/docs/firestore/manage-data/enable-offline#handle_offline_errors
 */
const RECOVERABLE_FIREBASE_CODES = new Set([
    'unavailable',          // Firestore offline / server unreachable
    'deadline-exceeded',    // Request timeout
    'cancelled',            // Request cancelled by client
    'network-request-failed', // Firebase network failure
    'resource-exhausted',   // Quota / rate limit — transient in many cases
]);

/**
 * Returns true if the error is a reliably identified, recoverable runtime
 * condition (offline, network failure, explicit cancellation).
 *
 * The safe default is FALSE — unknown errors are NOT classified as recoverable.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export function isRecoverableRuntimeError(error) {
    if (!error) return false;

    // 1. Explicit application-defined error types (highest reliability).
    //    ConnectivityService.requireOnline() throws OfflineError.
    if (error.name === 'OfflineError') return true;
    if (error.name === 'AbortError') return true;      // fetch/XHR cancellation

    // 2. Firebase / Firestore error codes (reliable structural signal).
    const code = typeof error.code === 'string' ? error.code : '';
    if (code && RECOVERABLE_FIREBASE_CODES.has(code)) return true;

    // 3. Last-resort message substring matching.
    //    Used ONLY for the one explicit Error thrown by FirestoreProductRepository._safeGetDocs:
    //    new Error("Offline cache miss. Preserving LKG data.")
    //    This is a known, controlled throw within our own codebase.
    const msg = typeof error.message === 'string' ? error.message : '';
    if (msg === 'Offline cache miss. Preserving LKG data.') return true;

    // Everything else: NOT recoverable.
    return false;
}
