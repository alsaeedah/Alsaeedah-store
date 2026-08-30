/**
 * @module taxonomy
 * @description Public API for the shared Taxonomy domain.
 */

export * from './entities.js';
export * from './constants.js';
export * from './errors.js';
export * from './utils.js';
export * from './validators.js';
export * from './repository.js';
export * from './store.js';
export * from './gender.js';
// Note: firestoreRepository is NOT exported here.
// Each app imports it directly to avoid firebase leaking as a shared dep.
