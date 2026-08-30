/**
 * authLogger.js
 * 
 * Lightweight authentication event logger.
 * Logs all auth events to the `auth_event_logs` table in Supabase
 * for monitoring and audit purposes (PRD §6 Non-Functional: Logging).
 * 
 * Event types:
 *   login_email        — Successful email/password login
 *   login_google       — Successful Google OAuth login
 *   signup_email       — Successful email/password registration (after OTP)
 *   signup_google      — First-time Google OAuth sign-in (treated as signup)
 *   logout             — User initiated logout
 *   password_reset_request  — Password reset email sent
 *   password_reset_complete — Password successfully updated after reset
 *   auth_error         — Any authentication error
 */

import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Log an authentication event to the database.
 * 
 * @param {string|null} userId  - The Supabase user UUID (null for pre-login errors)
 * @param {string}      eventType - One of the event type constants below
 * @param {string|null} provider  - 'email' | 'google' | null
 * @param {Object}      metadata  - Extra data (error messages, user-agent, etc.)
 */
export const logAuthEvent = async (userId, eventType, provider = null, metadata = {}) => {
    try {
        // Enrich metadata with browser context (non-sensitive)
        const enrichedMetadata = {
            ...metadata,
            userAgent: navigator?.userAgent?.substring(0, 150) || 'unknown',
            timestamp: new Date().toISOString(),
            platform: navigator?.platform || 'unknown',
        };

        const { ConnectivityService } = await import('@shared/connectivity/ConnectivityService');
        await ConnectivityService.getInstance().requireOnline();

        const docRef = await addDoc(collection(db, 'auth_event_logs'), {
            user_id: userId || null,
            event_type: eventType,
            provider: provider || null,
            metadata: enrichedMetadata,
            created_at: serverTimestamp()
        });
        console.log(`[AuthLogger] ✓ Logged: ${eventType}`, { userId, provider, docId: docRef.id });
    } catch (err) {
        // Silently fail — logging must never break auth flows
        console.warn('[AuthLogger] Unexpected error:', err.message);
    }
};

// ─── Event type constants ─────────────────────────────────────────────────────

export const AUTH_EVENTS = {
    LOGIN_EMAIL:              'login_email',
    LOGIN_GOOGLE:             'login_google',
    SIGNUP_EMAIL:             'signup_email',
    SIGNUP_GOOGLE:            'signup_google',
    LOGOUT:                   'logout',
    PASSWORD_RESET_REQUEST:   'password_reset_request',
    PASSWORD_RESET_COMPLETE:  'password_reset_complete',
    AUTH_ERROR:               'auth_error',
};
