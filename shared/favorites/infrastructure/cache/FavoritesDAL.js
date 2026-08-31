import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export class FavoritesDAL {
    constructor(userId, db) {
        this.userId = userId;
        this.db = db;
        this.cacheKey = `favorites_${userId}`;
        this.cache = [];
        this.initialized = false;
        this.listeners = new Set();
        this._storageEngine = null;
    }

    async _getStorageEngine() {
        if (!this._storageEngine) {
            const { StorageEngine } = await import('../../../storage/StorageEngine.js');
            this._storageEngine = StorageEngine;
        }
        return this._storageEngine;
    }

    async initialize() {
        if (this.initialized) return;
        const storage = await this._getStorageEngine();
        const cached = await storage.get(this.cacheKey);
        if (cached && Array.isArray(cached)) {
            this.cache = cached;
        }
        
        this.initialized = true;
    }

    _notify() {
        const effective = this.getEffectiveFavorites();
        this.listeners.forEach(fn => fn(effective));
    }

    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    getEffectiveFavorites() {
        // Return exactly what's in cache
        return [...this.cache];
    }

    async toggleFavorite(product) {
        if (!this.initialized) await this.initialize();

        const { ConnectivityService } = await import('../../../connectivity/ConnectivityService.js');
        await ConnectivityService.getInstance().requireOnline();

        const effective = this.getEffectiveFavorites();
        const isFav = effective.some(f => String(f.id) === String(product.id));
        const documentId = `${this.userId}_${product.id}`;
        const docRef = doc(this.db, 'favorites', documentId);

        if (isFav) {
            // Remove
            await deleteDoc(docRef);
            this.cache = this.cache.filter(f => String(f.id) !== String(product.id));
        } else {
            // Add
            const payload = {
                user_id: this.userId,
                product_id: String(product.id),
                product_data: product,
                updated_at: new Date().toISOString()
            };
            await setDoc(docRef, payload);
            
            this.cache.push({
                ...payload.product_data,
                id: payload.product_id,
                updated_at: payload.updated_at
            });
        }

        // Persist to local storage engine
        const storage = await this._getStorageEngine();
        await storage.set(this.cacheKey, this.cache);

        // Notify UI
        this._notify();
    }

    async setCache(serverFavorites) {
        if (!this.initialized) await this.initialize();
        
        this.cache = serverFavorites;
        const storage = await this._getStorageEngine();
        await storage.set(this.cacheKey, this.cache);
        this._notify();
    }
}
