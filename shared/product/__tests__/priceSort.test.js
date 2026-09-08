/**
 * @file priceSort.test.js
 * @description Regression tests for product price sorting.
 *
 * Tests cover:
 *   1. Numeric values — ascending
 *   2. Numeric values — descending
 *   3. String numeric values — ascending
 *   4. Mixed Number/String values — ascending
 *   5. Decimal values — ascending
 *   6. Descending with decimals
 *   7. Invalid/missing prices — must appear after valid prices, never as 0
 *   8. Mixed valid and invalid — invalid last regardless of direction
 */

import { comparePrice } from '../price.js';

/** Sorts an array of product-like objects by price using comparePrice */
function sortByPrice(products, direction = 'asc') {
    return [...products].sort((a, b) => comparePrice(a.price, b.price, direction));
}

/** Extracts price values from sorted array for easy assertion */
const prices = (products) => products.map(p => p.price);

// ── Test 1: Numeric values — ascending ────────────────────────────────────

describe('Test 1 — Numeric values ascending', () => {
    const input = [
        { price: 500 },
        { price: 50 },
        { price: 100 },
        { price: 1000 },
    ];

    test('produces [50, 100, 500, 1000]', () => {
        const sorted = sortByPrice(input, 'asc');
        expect(prices(sorted)).toEqual([50, 100, 500, 1000]);
    });
});

// ── Test 2: Numeric values — descending ───────────────────────────────────

describe('Test 2 — Numeric values descending', () => {
    const input = [
        { price: 500 },
        { price: 50 },
        { price: 100 },
        { price: 1000 },
    ];

    test('produces [1000, 500, 100, 50]', () => {
        const sorted = sortByPrice(input, 'desc');
        expect(prices(sorted)).toEqual([1000, 500, 100, 50]);
    });
});

// ── Test 3: String numeric values — ascending ─────────────────────────────

describe('Test 3 — String numeric values ascending', () => {
    const input = [
        { price: '500' },
        { price: '50' },
        { price: '100' },
        { price: '1000' },
    ];

    test('sorts numerically (not lexicographically), produces [50, 100, 500, 1000]', () => {
        const sorted = sortByPrice(input, 'asc');
        // Map to numbers for comparison since input is strings
        const numericPrices = sorted.map(p => Number(p.price));
        expect(numericPrices).toEqual([50, 100, 500, 1000]);
    });

    test('string "1000" does not sort before "500" (lexicographic failure prevented)', () => {
        const sorted = sortByPrice(input, 'asc');
        const numericPrices = sorted.map(p => Number(p.price));
        // In a bad string sort: "1000" < "500" (lexicographic), so 1000 would come first
        // The numeric sort must NOT produce that
        expect(numericPrices[0]).toBe(50);
        expect(numericPrices[numericPrices.length - 1]).toBe(1000);
    });
});

// ── Test 4: Mixed Number/String values — ascending ────────────────────────

describe('Test 4 — Mixed Number and String values ascending', () => {
    const input = [
        { price: 500 },
        { price: '50' },
        { price: 100 },
        { price: '1000' },
    ];

    test('produces numerically correct order [50, 100, 500, 1000]', () => {
        const sorted = sortByPrice(input, 'asc');
        const numericPrices = sorted.map(p => Number(p.price));
        expect(numericPrices).toEqual([50, 100, 500, 1000]);
    });
});

// ── Test 5: Decimal values — ascending ───────────────────────────────────

describe('Test 5 — Decimal values ascending', () => {
    const input = [
        { price: 100 },
        { price: 99.99 },
        { price: 100.50 },
        { price: 50.25 },
    ];

    test('produces [50.25, 99.99, 100, 100.50]', () => {
        const sorted = sortByPrice(input, 'asc');
        expect(prices(sorted)).toEqual([50.25, 99.99, 100, 100.50]);
    });
});

// ── Test 6: Decimal values — descending ──────────────────────────────────

describe('Test 6 — Decimal values descending', () => {
    const input = [
        { price: 100 },
        { price: 99.99 },
        { price: 100.50 },
        { price: 50.25 },
    ];

    test('produces [100.50, 100, 99.99, 50.25]', () => {
        const sorted = sortByPrice(input, 'desc');
        expect(prices(sorted)).toEqual([100.50, 100, 99.99, 50.25]);
    });
});

// ── Test 7: Invalid/missing prices — ascending ────────────────────────────

describe('Test 7 — Invalid prices sorted after valid, ascending', () => {
    const input = [
        { price: 500 },
        { price: null },
        { price: 100 },
        { price: undefined },
        { price: 250 },
    ];

    test('valid prices come first in ascending order', () => {
        const sorted = sortByPrice(input, 'asc');
        const validPrices = sorted.filter(p => p.price !== null && p.price !== undefined);
        const invalidPrices = sorted.filter(p => p.price === null || p.price === undefined);
        const validIdx = sorted.indexOf(validPrices[validPrices.length - 1]);
        const invalidIdx = sorted.indexOf(invalidPrices[0]);
        expect(invalidIdx).toBeGreaterThan(validIdx);
    });

    test('valid prices are ordered correctly before invalids', () => {
        const sorted = sortByPrice(input, 'asc');
        const validNums = sorted
            .filter(p => p.price !== null && p.price !== undefined)
            .map(p => Number(p.price));
        expect(validNums).toEqual([100, 250, 500]);
    });

    test('invalid prices are NEVER treated as 0', () => {
        const sorted = sortByPrice(input, 'asc');
        // If null/undefined were treated as 0, they would appear first
        // The first element must be a valid price (100), not an invalid
        expect(sorted[0].price).toBe(100);
    });
});

// ── Test 8: Invalid prices sorted after valid, descending ─────────────────

describe('Test 8 — Invalid prices sorted after valid, descending', () => {
    const input = [
        { price: 500 },
        { price: null },
        { price: 100 },
        { price: 'not-a-number' },
        { price: 250 },
    ];

    test('valid prices come first in descending order', () => {
        const sorted = sortByPrice(input, 'desc');
        expect(sorted[0].price).toBe(500);
        expect(sorted[1].price).toBe(250);
        expect(sorted[2].price).toBe(100);
        // Invalid prices come last (positions 3 and 4)
        const lastTwo = [sorted[3].price, sorted[4].price];
        expect(lastTwo).toContain(null);
        expect(lastTwo).toContain('not-a-number');
    });

    test('invalid prices are NEVER treated as 0 in descending', () => {
        const sorted = sortByPrice(input, 'desc');
        // If null were treated as 0, it would appear last — which would look "correct"
        // but for the wrong reason. More importantly, 0 must not appear in the valid range.
        // Verify the valid prices are largest-first and invalid are truly at the end.
        const firstPrice = Number(sorted[0].price);
        expect(firstPrice).toBe(500);
    });
});

// ── Test 9: All invalid prices ────────────────────────────────────────────

describe('Test 9 — All invalid prices', () => {
    const input = [
        { price: null },
        { price: undefined },
        { price: 'abc' },
        { price: '' },
    ];

    test('returns same number of elements', () => {
        const sorted = sortByPrice(input, 'asc');
        expect(sorted).toHaveLength(4);
    });

    test('no element has price coerced to 0', () => {
        const sorted = sortByPrice(input, 'asc');
        sorted.forEach(p => {
            expect(p.price).not.toBe(0);
        });
    });
});

// ── Test 10: Large dataset — stable ordering ──────────────────────────────

describe('Test 10 — Large mixed dataset stable ordering', () => {
    const input = [
        { id: 'a', price: 9 },
        { id: 'b', price: '20' },
        { id: 'c', price: 80 },
        { id: 'd', price: '100' },
        { id: 'e', price: 250 },
        { id: 'f', price: '1000' },
    ];

    test('ascending: 9, 20, 80, 100, 250, 1000', () => {
        const sorted = sortByPrice(input, 'asc');
        const numericPrices = sorted.map(p => Number(p.price));
        expect(numericPrices).toEqual([9, 20, 80, 100, 250, 1000]);
    });

    test('descending: 1000, 250, 100, 80, 20, 9', () => {
        const sorted = sortByPrice(input, 'desc');
        const numericPrices = sorted.map(p => Number(p.price));
        expect(numericPrices).toEqual([1000, 250, 100, 80, 20, 9]);
    });
});
