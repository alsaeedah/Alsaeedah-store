export class ProductCacheRegistry {
    constructor(storage) {
        this.storage = storage;
        this.registryKey = `query_index_registry_v2`;
        this.legacyRegistryKey = `product_cache_registry_v1`;
        this.registry = null;
        this.savePromise = null;
        
        // LRU Limits per type for Query Indexes
        this.limits = {
            lists: 20,
            details: 50,
            latest: 5,
            bestsellers: 5,
            related: 20,
            stats: 1
        };
        
        // Perform migration asynchronously on instantiation
        this._migrateV1Cache().catch(console.error);
    }

    async _migrateV1Cache() {
        try {
            const legacyData = await this.storage.get(this.legacyRegistryKey);
            if (legacyData) {
                console.log('[ProductCacheRegistry] Migrating legacy v1 cache...');
                const keysToRemove = [];
                for (const type in legacyData) {
                    for (const key in legacyData[type]) {
                        keysToRemove.push(key);
                    }
                }
                
                for (let i = 0; i < keysToRemove.length; i++) {
                    await this.storage.remove(keysToRemove[i]).catch(() => {});
                    if (i > 0 && i % 10 === 0) {
                        await new Promise(r => setTimeout(r, 0));
                    }
                }
                
                await this.storage.remove(this.legacyRegistryKey);
                console.log(`[ProductCacheRegistry] Successfully cleared ${keysToRemove.length} legacy v1 cache entries.`);
            }
        } catch (err) {
            console.warn(`[ProductCacheRegistry] Failed during legacy v1 cache migration:`, err);
        }
    }

    async _load() {
        if (!this.registry) {
            try {
                const data = await this.storage.get(this.registryKey);
                this.registry = data || {
                    lists: {},
                    details: {},
                    latest: {},
                    bestsellers: {},
                    related: {},
                    stats: {}
                };
            } catch (err) {
                console.warn(`[ProductCacheRegistry] Failed to load registry:`, err);
                // Fallback to empty in-memory registry if read fails
                this.registry = { lists: {}, details: {}, latest: {}, bestsellers: {}, related: {}, stats: {} };
            }
        }
    }

    _save() {
        if (!this.savePromise) {
            this.savePromise = Promise.resolve().then(async () => {
                try {
                    await this.storage.set(this.registryKey, this.registry);
                } catch (err) {
                    console.warn(`[ProductCacheRegistry] Failed to save registry:`, err);
                } finally {
                    this.savePromise = null;
                }
            });
        }
        return this.savePromise;
    }

    /**
     * Records a cache access, updating its lastAccessed timestamp.
     * Enforces LRU limits.
     * Returns an array of keys that were evicted and should be deleted from StorageEngine.
     */
    async access(type, key) {
        try {
            await this._load();
            if (!this.registry[type]) this.registry[type] = {};
            
            // Record access (true LRU timestamp)
            this.registry[type][key] = {
                key,
                type,
                lastAccessed: Date.now()
            };

            const evictedKeys = [];
            const limit = this.limits[type];
            if (limit) {
                const entries = Object.values(this.registry[type]);
                if (entries.length > limit) {
                    // Sort by lastAccessed ascending (oldest first)
                    entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
                    
                    // Evict oldest entries until we are at the limit
                    const toEvict = entries.length - limit;
                    for (let i = 0; i < toEvict; i++) {
                        const entry = entries[i];
                        evictedKeys.push(entry.key);
                        delete this.registry[type][entry.key];
                    }
                }
            }

            // Non-blocking save
            this._save().catch(() => {});
            
            return evictedKeys;
        } catch (err) {
            console.warn(`[ProductCacheRegistry] Failed during access recording:`, err);
            return [];
        }
    }

    async remove(type, key) {
        try {
            await this._load();
            if (this.registry[type] && this.registry[type][key]) {
                delete this.registry[type][key];
                this._save().catch(() => {});
            }
        } catch (err) {
            console.warn(`[ProductCacheRegistry] Failed during key removal:`, err);
        }
    }

    async getAllKeys(type) {
        try {
            await this._load();
            return this.registry[type] ? Object.keys(this.registry[type]) : [];
        } catch (err) {
            return [];
        }
    }

    async clearType(type) {
        try {
            await this._load();
            if (this.registry[type]) {
                this.registry[type] = {};
                this._save().catch(() => {});
            }
        } catch (err) {
            console.warn(`[ProductCacheRegistry] Failed during clearType:`, err);
        }
    }
}
