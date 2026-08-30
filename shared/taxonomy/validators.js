/**
 * @module validators
 * @description Shared domain validators for taxonomy operations.
 */

import { ValidationError } from './errors.js';

/**
 * Validates a slug format.
 * A valid slug contains only:
 *  - Lowercase ASCII letters (a-z)
 *  - Digits (0-9)
 *  - Arabic letters (Unicode U+0600–U+06FF)
 *  - Hyphens (-) as separators
 * The slug cannot start or end with a hyphen, and cannot contain consecutive hyphens.
 *
 * @param {string} slug - The slug to validate.
 * @returns {boolean} True if the slug is valid.
 *
 * @example
 * validateSlug('mens-watches')     // true
 * validateSlug('ساعات-رجالية')   // true
 * validateSlug('--bad')            // false
 * validateSlug('')                 // false
 * validateSlug('Has Space')        // false
 */
export function validateSlug(slug) {
  if (typeof slug !== 'string' || !slug.trim()) return false;
  // Accepts: lowercase a-z, digits 0-9, Arabic block U+0600-U+06FF, and hyphens.
  // Structure: one or more valid chars, optionally followed by (-valid-chars)+ groups.
  const slugRegex = /^[a-z0-9\u0600-\u06FF]+(?:-[a-z0-9\u0600-\u06FF]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Validates the order property.
 * Order must be a non-negative number.
 * @param {number} order - The order to validate.
 * @returns {boolean} True if the order is valid.
 */
export function validateOrder(order) {
  return typeof order === 'number' && !isNaN(order) && order >= 0;
}

/**
 * Validates a Brand entity against the domain schema.
 * Throws a ValidationError if the entity is invalid.
 * @param {Partial<import('./entities').BrandEntity>} entity - The entity to validate.
 * @throws {ValidationError} If the entity fails validation.
 */
export function validateBrand(entity) {
  if (!entity || typeof entity !== 'object') {
    throw new ValidationError('Brand entity must be an object.');
  }

  if (typeof entity.name !== 'string' || !entity.name.trim()) {
    throw new ValidationError('Brand name is required and must be a string.');
  }

  if (entity.order !== undefined && !validateOrder(entity.order)) {
    throw new ValidationError('Brand order must be a non-negative number.');
  }

  if (entity.active !== undefined && typeof entity.active !== 'boolean') {
    throw new ValidationError('Brand active status must be a boolean.');
  }
}

/**
 * Validates a taxonomy entity (Category/Collection) against the domain schema.
 * Throws a ValidationError if the entity is invalid.
 * @param {Partial<import('./entities').TaxonomyEntity>} entity - The entity to validate.
 * @throws {ValidationError} If the entity fails validation.
 */
export function validateTaxonomy(entity) {
  if (!entity || typeof entity !== 'object') {
    throw new ValidationError('Taxonomy entity must be an object.');
  }

  if (typeof entity.name !== 'string' || !entity.name.trim()) {
    throw new ValidationError('Taxonomy name is required and must be a string.');
  }

  if (!validateSlug(entity.slug)) {
    throw new ValidationError('Taxonomy slug is invalid. It must contain only lowercase letters, numbers, and hyphens.');
  }

  if (entity.order !== undefined && !validateOrder(entity.order)) {
    throw new ValidationError('Taxonomy order must be a non-negative number.');
  }

  if (entity.active !== undefined && typeof entity.active !== 'boolean') {
    throw new ValidationError('Taxonomy active status must be a boolean.');
  }
}
