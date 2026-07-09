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

import { supabase } from '../supabase/client';

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

        const { error } = await supabase
            .from('auth_event_logs')
            .insert({
                user_id: userId || null,
                event_type: eventType,
                provider: provider || null,
                metadata: enrichedMetadata,
            });

        if (error) {
            // Silently fail — logging should never block auth operations
            console.warn('[AuthLogger] Failed to log event:', eventType, error.message);
        } else {
            console.log(`[AuthLogger] ✓ Logged: ${eventType}`, { userId, provider });
        }
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
