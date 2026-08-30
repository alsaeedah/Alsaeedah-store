/**
 * @module errors
 * @description Shared domain errors for the Taxonomy module.
 */

/**
 * Base error class for taxonomy-related errors.
 */
export class TaxonomyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TaxonomyError';
  }
}

/**
 * Error thrown when taxonomy validation fails.
 */
export class ValidationError extends TaxonomyError {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when attempting to create a taxonomy entity with a slug that already exists.
 */
export class DuplicateSlugError extends TaxonomyError {
  constructor(message) {
    super(message);
    this.name = 'DuplicateSlugError';
  }
}
