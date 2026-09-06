/**
 * permissions.js — Canonical Authorization Resolver
 *
 * Single source of truth for converting raw Firestore permission data
 * into a consistent boolean-map used throughout the application.
 *
 * AUTHORIZATION CONTRACT:
 *   hasPermission(p) ↔ resolvedPermissions[p] === true
 *
 * RULES:
 *   - Super Admin (role === "super_admin") → full access regardless of rawPermissions format
 *   - Manager (role === "manager")         → Firestore Map { key: bool } resolved strictly
 *   - Only strict boolean `true` grants a permission
 *   - "true", 1, "yes", truthy values DO NOT grant access
 *   - Malformed / null / undefined / Array input for non-super_admin → deny safely ({})
 *   - Never adds permissions not present in the source data
 *   - Never allows a manager to gain "all" or "super_admin"
 *   - Never throws — all malformed input is handled gracefully
 *
 * CONSUMERS:
 *   - dashbourd/src/store/useAuthStore.js
 *   - shared/startup/authSync.js
 *
 * DO NOT duplicate this logic elsewhere in the codebase.
 */

/**
 * resolvePermissions
 *
 * @param {*} rawPermissions - Raw value from Firestore data.permissions
 * @param {string} role      - The user's role: "super_admin" | "manager" | other
 * @returns {Object}         - Plain object where every key maps to a strict boolean.
 *                             Only keys whose value is exactly `true` are granted.
 */
export function resolvePermissions(rawPermissions, role) {
    // ── Super Admin ──────────────────────────────────────────────────────────
    // Role alone is the authoritative source of full access.
    // The rawPermissions format (["all"] or anything else) is irrelevant.
    if (role === 'super_admin') {
        return {
            products: true,
            orders:   true,
            users:    true,
            settings: true,
            managers: true
        };
    }

    // ── Manager ──────────────────────────────────────────────────────────────
    // Firestore stores permissions as a Map: { products: true, orders: false, ... }
    // Strictly filter: only keys whose value is exactly boolean true are granted.
    // This guards against "true", 1, "yes", or any other truthy non-boolean value.
    if (
        rawPermissions !== null &&
        rawPermissions !== undefined &&
        typeof rawPermissions === 'object' &&
        !Array.isArray(rawPermissions)
    ) {
        const resolved = {};
        for (const [key, value] of Object.entries(rawPermissions)) {
            resolved[key] = value === true; // strict boolean — nothing else grants access
        }
        return resolved;
    }

    // ── Unknown / Malformed ──────────────────────────────────────────────────
    // Array (["all"]), null, undefined, string, number — all denied safely.
    // Log unexpected formats for diagnostics, but never throw.
    if (rawPermissions !== null && rawPermissions !== undefined) {
        console.warn(
            '[resolvePermissions] Unexpected permissions format — denying access.',
            { type: typeof rawPermissions, isArray: Array.isArray(rawPermissions), role }
        );
    }
    return {};
}
