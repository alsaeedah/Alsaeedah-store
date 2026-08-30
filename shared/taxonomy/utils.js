/**
 * @module utils
 * @description Shared domain utilities for taxonomy operations.
 */

/**
 * Normalizes a given name by trimming whitespace and converting to lower case for comparison.
 * @param {string} name - The original name.
 * @returns {string} The normalized name.
 */
export function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().toLowerCase();
}

/**
 * Creates a URL-friendly slug from a given string.
 * Supports both English (ASCII) and Arabic (Unicode U+0600–U+06FF) characters.
 *
 * Process:
 *  1. NFD-normalize to decompose combined characters.
 *  2. Strip Latin diacritics (U+0300–U+036F) so é → e, ñ → n, etc.
 *  3. Lowercase English letters.
 *  4. Trim surrounding whitespace.
 *  5. Remove every character that is NOT: a-z, 0-9, Arabic block, space, or hyphen.
 *     — This removes punctuation (apostrophes, ampersands, etc.) while preserving Arabic.
 *  6. Collapse consecutive spaces/hyphens into a single hyphen.
 *  7. Strip leading/trailing hyphens.
 *
 * @param {string} text - The text to slugify.
 * @returns {string} The slugified string.
 *
 * @example
 * createSlug("Men's Watches")        // → "mens-watches"
 * createSlug("ساعات رجالية")         // → "ساعات-رجالية"
 * createSlug("ساعات Casio رجالية")   // → "ساعات-casio-رجالية"
 * createSlug("Watches   &   Bags")   // → "watches-bags"
 * createSlug("")                      // → ""
 */
export function createSlug(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFD')               // Decompose combined characters (e.g. é → e + ́)
    .replace(/[\u0300-\u036f]/g, '') // Strip Latin diacritics only
    .toLowerCase()                   // Lowercase English letters (Arabic unaffected)
    .trim()                          // Remove surrounding whitespace
    // Keep: a-z, 0-9, Arabic Unicode block (U+0600–U+06FF), spaces, hyphens
    // Remove: punctuation (apostrophes, ampersands, etc.) and all other chars
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/[\s-]+/g, '-')         // Collapse whitespace & hyphens → single hyphen
    .replace(/^-+|-+$/g, '');        // Trim leading/trailing hyphens
}

/**
 * Sorts an array of taxonomy entities based on their `order` property.
 * @param {Array<import('./entities').TaxonomyEntity>} entities - The array of entities to sort.
 * @returns {Array<import('./entities').TaxonomyEntity>} A new sorted array.
 */
export function sortByOrder(entities) {
  if (!Array.isArray(entities)) return [];
  return [...entities].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : 0;
    const orderB = typeof b.order === 'number' ? b.order : 0;
    return orderA - orderB;
  });
}
