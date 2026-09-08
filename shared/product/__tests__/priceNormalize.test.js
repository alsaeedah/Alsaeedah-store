/**
 * @file priceNormalize.test.js
 * @description Unit tests for normalizeProductPrice, isValidPrice, comparePrice.
 */

import {
    normalizeProductPrice,
    isValidPrice,
    normalizePriceOrAbsent,
    PRICE_ABSENT,
    comparePrice
} from '../price.js';

// ── normalizeProductPrice ──────────────────────────────────────────────────

describe('normalizeProductPrice', () => {
    test('converts valid numeric string to Number', () => {
        expect(normalizeProductPrice('100')).toBe(100);
    });

    test('passes through a valid Number unchanged', () => {
        expect(normalizeProductPrice(100)).toBe(100);
    });

    test('converts decimal string correctly', () => {
        expect(normalizeProductPrice('100.50')).toBe(100.5);
    });

    test('passes through a decimal Number unchanged', () => {
        expect(normalizeProductPrice(100.50)).toBe(100.5);
    });

    test('returns NaN for empty string', () => {
        expect(normalizeProductPrice('')).toBeNaN();
    });

    test('returns NaN for null', () => {
        expect(normalizeProductPrice(null)).toBeNaN();
    });

    test('returns NaN for undefined', () => {
        expect(normalizeProductPrice(undefined)).toBeNaN();
    });

    test('returns NaN for non-numeric string', () => {
        expect(normalizeProductPrice('abc')).toBeNaN();
    });

    test('returns NaN for NaN input', () => {
        expect(normalizeProductPrice(NaN)).toBeNaN();
    });

    test('returns NaN for Infinity', () => {
        expect(normalizeProductPrice(Infinity)).toBeNaN();
    });

    test('returns NaN for -Infinity', () => {
        expect(normalizeProductPrice(-Infinity)).toBeNaN();
    });

    test('handles zero', () => {
        expect(normalizeProductPrice(0)).toBe(0);
        expect(normalizeProductPrice('0')).toBe(0);
    });

    test('handles string with whitespace (valid numeric)', () => {
        // Number(' 100 ') === 100 in JS — acceptable
        expect(normalizeProductPrice(' 100 ')).toBe(100);
    });
});

// ── isValidPrice ───────────────────────────────────────────────────────────

describe('isValidPrice', () => {
    test('returns true for positive Number', () => {
        expect(isValidPrice(100)).toBe(true);
    });

    test('returns true for zero', () => {
        expect(isValidPrice(0)).toBe(true);
    });

    test('returns true for decimal Number', () => {
        expect(isValidPrice(99.99)).toBe(true);
    });

    test('returns false for negative Number', () => {
        expect(isValidPrice(-1)).toBe(false);
    });

    test('returns false for NaN', () => {
        expect(isValidPrice(NaN)).toBe(false);
    });

    test('returns false for Infinity', () => {
        expect(isValidPrice(Infinity)).toBe(false);
    });

    test('returns false for string "100"', () => {
        expect(isValidPrice('100')).toBe(false);
    });

    test('returns false for null', () => {
        expect(isValidPrice(null)).toBe(false);
    });

    test('returns false for undefined', () => {
        expect(isValidPrice(undefined)).toBe(false);
    });
});

// ── normalizePriceOrAbsent ─────────────────────────────────────────────────

describe('normalizePriceOrAbsent', () => {
    test('returns PRICE_ABSENT for null', () => {
        expect(normalizePriceOrAbsent(null)).toBe(PRICE_ABSENT);
    });

    test('returns PRICE_ABSENT for undefined', () => {
        expect(normalizePriceOrAbsent(undefined)).toBe(PRICE_ABSENT);
    });

    test('returns numeric value for valid string', () => {
        expect(normalizePriceOrAbsent('250')).toBe(250);
    });

    test('returns numeric value for valid Number', () => {
        expect(normalizePriceOrAbsent(250)).toBe(250);
    });

    test('throws for invalid string value', () => {
        expect(() => normalizePriceOrAbsent('abc', 'old_price')).toThrow();
    });

    test('throws for empty string', () => {
        expect(() => normalizePriceOrAbsent('', 'old_price')).toThrow();
    });

    test('throws for Infinity', () => {
        expect(() => normalizePriceOrAbsent(Infinity, 'old_price')).toThrow();
    });
});

// ── comparePrice ───────────────────────────────────────────────────────────

describe('comparePrice', () => {
    test('asc: smaller price first', () => {
        expect(comparePrice(50, 100, 'asc')).toBeLessThan(0);
    });

    test('asc: larger price second', () => {
        expect(comparePrice(100, 50, 'asc')).toBeGreaterThan(0);
    });

    test('desc: larger price first', () => {
        expect(comparePrice(100, 50, 'desc')).toBeLessThan(0);
    });

    test('desc: smaller price second', () => {
        expect(comparePrice(50, 100, 'desc')).toBeGreaterThan(0);
    });

    test('equal prices: returns 0', () => {
        expect(comparePrice(100, 100, 'asc')).toBe(0);
    });

    test('invalid left price sorts after valid right', () => {
        expect(comparePrice(null, 100, 'asc')).toBeGreaterThan(0);
    });

    test('invalid right price sorts after valid left', () => {
        expect(comparePrice(100, null, 'asc')).toBeLessThan(0);
    });

    test('both invalid: returns 0', () => {
        expect(comparePrice(null, undefined, 'asc')).toBe(0);
    });

    test('string price compared numerically asc', () => {
        expect(comparePrice('50', '100', 'asc')).toBeLessThan(0);
    });

    test('string price compared numerically desc', () => {
        expect(comparePrice('100', '50', 'desc')).toBeLessThan(0);
    });
});
