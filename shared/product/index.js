/**
 * @module product
 * @description The public API entry point for the Product Domain layer.
 * All product taxonomy preparation structures, constants, and utilities must be imported from here.
 * Direct imports from internal files (e.g. ./constants) should be avoided by consumers.
 */

export * from './constants.js';
export * from './compatibility.js';
export * from './validators.js';
export * from './migrationContracts.js';
export * from './legacyMapping.js';
export * from './resolvers.js';
