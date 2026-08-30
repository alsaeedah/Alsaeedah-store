/**
 * @module firestoreRepository
 * @description Firestore implementation of the TaxonomyRepository contract.
 */
import { collection, doc, getDocs, addDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { TAXONOMY_TYPES } from '../constants.js';

export class FirestoreTaxonomyRepository {
  /**
   * @param {import('firebase/firestore').Firestore} db - The initialized Firestore instance.
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Helper to map a taxonomy type identifier to its Firestore collection name.
   * @param {string} type - The taxonomy type identifier.
   * @returns {string} The collection name.
   */
  _getCollectionName(type) {
    switch (type) {
      case TAXONOMY_TYPES.CATEGORY: return 'categories';
      case TAXONOMY_TYPES.BRAND: return 'brands';
      case TAXONOMY_TYPES.COLLECTION: return 'collections';
      default: throw new Error(`Unknown taxonomy type: ${type}`);
    }
  }

  async getAll(type) {
    const colName = this._getCollectionName(type);
    const snapshot = await getDocs(collection(this.db, colName));
    
    // OFFLINE-FIRST LKG PROTECTION:
    // If the network is disconnected, getDocs might not throw an error, 
    // but instead return an empty snapshot from the memory cache (if no persistent cache exists yet).
    // We must NOT interpret this as "the database has 0 items", which would wipe out the UI.
    if (snapshot.empty && snapshot.metadata && snapshot.metadata.fromCache) {
      throw new Error("Offline cache miss. Preserving LKG data.");
    }
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getActive(type) {
    const colName = this._getCollectionName(type);
    const q = query(collection(this.db, colName), where('active', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getBySlug(type, slug) {
    const colName = this._getCollectionName(type);
    const q = query(collection(this.db, colName), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  async create(type, data) {
    const colName = this._getCollectionName(type);

    // ── Auto-order: calculate max(order) + 1 across ALL items (including inactive)
    // so that soft-deleted items do not cause duplicate order values.
    // We only do this when the caller has not explicitly provided an order value
    // (the edit path always includes the existing order, so this guard is a safety net).
    let orderToAssign = data.order;
    if (orderToAssign === undefined || orderToAssign === null) {
      const existing = await this.getAll(type);
      const maxOrder = existing.reduce(
        (max, item) => Math.max(max, typeof item.order === 'number' ? item.order : 0),
        0
      );
      // First item in an empty collection → order: 1.
      orderToAssign = maxOrder + 1;
    }

    const docData = {
      ...data,
      order: orderToAssign,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(this.db, colName), docData);
    
    // Return the inserted data with a local date so the UI state can serialize it cleanly 
    // before the server timestamp resolves.
    const isoDate = new Date().toISOString();
    return { id: docRef.id, ...data, order: orderToAssign, createdAt: isoDate, updatedAt: isoDate };
  }

  async update(type, id, updates) {
    const colName = this._getCollectionName(type);
    const docRef = doc(this.db, colName, id);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(docRef, updateData);
    
    const isoDate = new Date().toISOString();
    return { id, ...updates, updatedAt: isoDate };
  }

  async deactivate(type, id) {
    const colName = this._getCollectionName(type);
    const docRef = doc(this.db, colName, id);
    await updateDoc(docRef, { 
      active: false,
      updatedAt: serverTimestamp()
    });
  }
}
