/**
 * @module taxonomyService
 * @description Provides the initialized Taxonomy repository for the dashboard application.
 */
import { db } from '../firebase/config';
// Note: We import the infrastructure layer separately as per architectural guidelines
import { FirestoreTaxonomyRepository } from 'shared/taxonomy/infrastructure/firestoreRepository';
import { TaxonomyDAL } from 'shared/taxonomy/infrastructure/cache/TaxonomyDAL';
import { CachedTaxonomyRepository } from 'shared/taxonomy/infrastructure/CachedTaxonomyRepository';
import { taxonomyStore } from 'shared/taxonomy';

const firestoreDb = new FirestoreTaxonomyRepository(db);
const dal = new TaxonomyDAL(firestoreDb);
export const taxonomyRepository = new CachedTaxonomyRepository(dal, firestoreDb);

/**
 * Initializes the taxonomy store by fetching all data from the repository.
 * This should be called once when the taxonomy manager mounts.
 */
export const initTaxonomyStore = async () => {
  return taxonomyStore.getState().fetchTaxonomies(taxonomyRepository);
};
