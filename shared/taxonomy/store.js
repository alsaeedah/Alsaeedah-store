/**
 * @module store
 * @description Zustand vanilla store for Taxonomy state management.
 * This file is framework-agnostic and does not depend on React or Firebase.
 */

import { createStore } from 'zustand/vanilla';
import { TAXONOMY_TYPES } from './constants.js';

// Internal module variable to track the active fetch promise and prevent duplicate requests.
let currentRequest = null;

/**
 * Creates the vanilla Zustand store for taxonomy data.
 */
export const taxonomyStore = createStore((set, get) => ({
  // Domain Data
  categories: [],
  brands: [],
  collections: [],

  // Common States
  status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
  error: null, // Preserves the original repository error
  initialized: false, // Tracks if data has been loaded at least once

  /**
   * Fetches all taxonomy data sequentially.
   * @param {import('./repository').TaxonomyRepository} repository - The data access layer implementation.
   * @param {Object} options - Fetch options.
   * @param {boolean} [options.force=false] - If true, bypasses the initialized check and forces a refresh.
   * @returns {Promise<void>}
   */
  fetchTaxonomies: async (repository, options = { force: false }) => {
    // 1. Check if a request is currently in-flight
    if (currentRequest) {
      return currentRequest;
    }

    // 2. Check if already initialized to prevent unnecessary reloads (unless forced)
    const { initialized } = get();
    if (!options.force && initialized) {
      return Promise.resolve();
    }

    // 3. Set loading state (we do NOT clear existing data to preserve UX)
    set({ status: 'loading', error: null });

    // 4. Create and store the request promise
    currentRequest = (async () => {
      try {
        // Track whether background revalidation has already updated each slice
        let revalidated = { categories: false, brands: false, collections: false };

        // We pass onRevalidated so the DAL can update the store instantly when background SWR completes
        const [categories, brands, collections] = await Promise.all([
          repository.getAll(TAXONOMY_TYPES.CATEGORY, { 
            force: options.force, 
            onRevalidated: data => {
              revalidated.categories = true;
              set(state => ({ ...state, categories: data || [] }));
            }
          }),
          repository.getAll(TAXONOMY_TYPES.BRAND, { 
            force: options.force, 
            onRevalidated: data => {
              revalidated.brands = true;
              set(state => ({ ...state, brands: data || [] }));
            }
          }),
          repository.getAll(TAXONOMY_TYPES.COLLECTION, { 
            force: options.force, 
            onRevalidated: data => {
              revalidated.collections = true;
              set(state => ({ ...state, collections: data || [] }));
            }
          })
        ]);

        // Update state with fetched data (which will be the instant cache data)
        // Only use the `Promise.all` result if the background `onRevalidated` 
        // callback has NOT yet fired, to avoid overwriting fresh data with stale cache.
        set((state) => ({
          categories: revalidated.categories ? state.categories : (categories || []),
          brands: revalidated.brands ? state.brands : (brands || []),
          collections: revalidated.collections ? state.collections : (collections || []),
          status: 'success',
          initialized: true,
        }));
      } catch (error) {
        // Preserve the original error for consumer handling
        set({
          status: 'error',
          error: error,
        });
      } finally {
        // Clear the request tracker regardless of success/failure
        currentRequest = null;
      }
    })();

    return currentRequest;
  },

  /**
   * Optimistically add an entity to the local state.
   */
  addEntity: (type, entity) => {
    set((state) => {
      // type might be 'category', 'brand', etc. We map to the plural array name.
      const arrayName = type === TAXONOMY_TYPES.CATEGORY ? 'categories' : type + 's';
      return { [arrayName]: [...state[arrayName], entity] };
    });
  },

  /**
   * Optimistically update an entity in the local state.
   */
  updateEntity: (type, id, updates) => {
    set((state) => {
      const arrayName = type === TAXONOMY_TYPES.CATEGORY ? 'categories' : type + 's';
      return {
        [arrayName]: state[arrayName].map((entity) =>
          entity.id === id ? { ...entity, ...updates } : entity
        ),
      };
    });
  },

  /**
   * Resets the store back to its initial state.
   */
  reset: () => {
    set({
      categories: [],
      brands: [],
      collections: [],
      status: 'idle',
      error: null,
      initialized: false,
    });
  }
}));
