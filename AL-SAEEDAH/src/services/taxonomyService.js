import { taxonomyStore } from '../../../shared/taxonomy/index.js';
import { FirestoreTaxonomyRepository } from '../../../shared/taxonomy/infrastructure/firestoreRepository.js';
import { TaxonomyDAL } from '../../../shared/taxonomy/infrastructure/cache/TaxonomyDAL.js';
import { CachedTaxonomyRepository } from '../../../shared/taxonomy/infrastructure/CachedTaxonomyRepository.js';
import { useStore } from 'zustand';
import { db } from '../firebase/config.js';
import { lifecycleCoordinator } from '../../../shared/startup/LifecycleCoordinator.js';

// Initialize the caching layer and repository
const firestoreRepository = new FirestoreTaxonomyRepository(db);
const dal = new TaxonomyDAL(firestoreRepository);
const repository = new CachedTaxonomyRepository(dal, firestoreRepository);

// Auto-revalidate taxonomy on lifecycle events
lifecycleCoordinator.subscribe(() => {
    // Only refresh if already initialized to avoid duplicate initial fetches
    if (taxonomyStore.getState().initialized) {
        refreshTaxonomies();
    }
});

/**
 * Ensures taxonomy cache is fully initialized exactly once.
 * Prevents redundant Firestore queries and prepares the architecture for Offline First.
 */
export const initializeTaxonomies = async () => {
    // Only attempt to fetch if the store hasn't already been initialized
    if (!taxonomyStore.getState().initialized) {
        try {
            await taxonomyStore.getState().fetchTaxonomies(repository);
        } catch (error) {
            console.error('Failed to initialize taxonomy store:', error);
            // Error state is caught and exposed by taxonomyStore
        }
    }
};

/**
 * Explicitly forces a refresh of the taxonomy store data from Firestore.
 * This bypasses the initialized guard but still respects the in-flight deduplication.
 */
export const refreshTaxonomies = async () => {
    try {
        await taxonomyStore.getState().fetchTaxonomies(repository, { force: true });
    } catch (error) {
        console.error('Failed to refresh taxonomy store:', error);
        // Error state is exposed via taxonomyStore, we don't throw to prevent UI crash
    }
};

/**
 * React hook to subscribe to taxonomy store state.
 * Wraps the vanilla Zustand store with the React useStore adapter.
 * @param {Function} [selector] - Optional selector to pick specific state slice.
 */
export const useTaxonomyStore = (selector) => {
    return useStore(taxonomyStore, selector);
};
