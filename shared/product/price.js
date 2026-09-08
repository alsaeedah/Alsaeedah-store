/**
 * @module product/price
 * @description
 * Canonical price normalization and validation utilities for the Product domain.
 *
 * These functions are the single authoritative source for price type enforcement.
 * They must be used by:
 *   - ProductForm / AddProduct / EditProduct (UI layer)
 *   - FirestoreProductRepository (persistence boundary)
 *   - Migration scripts
 *   - Any sorting/comparison logic that operates on price values
 *
 * Invariant:
 *   Any valid product price that enters the persistence layer MUST be a JavaScript Number.
 */

/**
 * Sentinel value returned by normalizePriceOrAbsent when a price field is
 * legitimately absent (null / undefined) for an optional price field.
 * Callers should omit the field from the Firestore payload when they receive this.
 */
export const PRICE_ABSENT = Symbol('PRICE_ABSENT');

/**
 * Normalizes a price value to a JavaScript Number.
 *
 * Valid conversions:
 *   "100"     → 100
 *   100       → 100
 *   "100.50"  → 100.5
 *   100.50    → 100.5
 *
 * Invalid values (returns NaN):
 *   ""        → NaN
 *   null      → NaN
 *   undefined → NaN
 *   "abc"     → NaN
 *   NaN       → NaN
 *   Infinity  → NaN
 *   -Infinity → NaN
 *
 * @param {*} value
 * @returns {number} A finite number, or NaN if the value is invalid.
 */
export function normalizeProductPrice(value) {
    if (value === null || value === undefined || value === '') {
        return NaN;
    }
    const n = Number(value);
    // Reject non-finite values (NaN, Infinity, -Infinity)
    if (!isFinite(n)) {
        return NaN;
    }
    return n;
}

/**
 * Returns true only if the value is a valid, finite, non-negative Number.
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isValidPrice(value) {
    return typeof value === 'number' && isFinite(value) && value >= 0;
}

/**
 * For optional price fields (e.g. old_price, variant.price):
 *
 * - If the value is legitimately absent (null / undefined): returns PRICE_ABSENT.
 *   The caller should omit the field from the Firestore payload.
 * - If the value is present: normalizes and validates it.
 *   Returns the numeric value if valid, or throws if the value is present but invalid.
 *
 * This ensures optional fields are never created with malformed values,
 * but also are not created when they were never meant to exist.
 *
 * @param {*} value
 * @param {string} fieldName - Used in the error message.
 * @returns {number|symbol} Numeric price or PRICE_ABSENT.
 * @throws {Error} If the value is present but invalid.
 */
export function normalizePriceOrAbsent(value, fieldName = 'price') {
    if (value === null || value === undefined) {
        return PRICE_ABSENT;
    }
    const n = normalizeProductPrice(value);
    if (isNaN(n)) {
        throw new Error(
            `Invalid value for optional price field "${fieldName}": ${JSON.stringify(value)}. ` +
            `Expected a finite number or null/undefined. ` +
            `This value will not be persisted to prevent data corruption.`
        );
    }
    return n;
}

/**
 * Compares two price values numerically for use in Array.prototype.sort.
 *
 * Invalid prices (NaN, strings, etc.) are always placed AFTER valid prices.
 * For ascending: smallest valid first, invalid last.
 * For descending: largest valid first, invalid last.
 *
 * @param {*} a
 * @param {*} b
 * @param {'asc'|'desc'} direction
 * @returns {number}
 */
export function comparePrice(a, b, direction = 'asc') {
    // Use normalizeProductPrice so that null/undefined/'' are treated as NaN (invalid),
    // NOT as 0. Raw Number(null) === 0 which is finite — that would incorrectly
    // make null appear as the cheapest product.
    const aPrice = normalizeProductPrice(a);
    const bPrice = normalizeProductPrice(b);
    const aInvalid = isNaN(aPrice);
    const bInvalid = isNaN(bPrice);

    if (aInvalid && bInvalid) return 0;
    if (aInvalid) return 1;  // invalid always goes after valid
    if (bInvalid) return -1;

    return direction === 'asc' ? aPrice - bPrice : bPrice - aPrice;
}
