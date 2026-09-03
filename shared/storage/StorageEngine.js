import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { openDB } from 'idb';

const DB_NAME = 'AL_SAEEDAH_CACHE';
const STORE_NAME = 'taxonomy_cache';

let _idbPromise = null;

function getDb() {
    if (Capacitor.isNativePlatform()) return null;
    
    if (!_idbPromise) {
        _idbPromise = openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            },
            terminated() {
                // Connection was closed by the browser (e.g. user clearing data or another tab upgrading)
                _idbPromise = null;
            }
        }).catch(err => {
            _idbPromise = null;
            throw err;
        });
    }
    return _idbPromise;
}

/**
 * StorageEngine
 * Provides a unified key-value interface over either Capacitor Preferences (for mobile)
 * or IndexedDB via `idb` (for web). 
 */
export const StorageEngine = {
    /**
     * Stores a JSON-serializable value.
     * @param {string} key 
     * @param {any} value 
     */
    async set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            if (Capacitor.isNativePlatform()) {
                await Preferences.set({ key, value: serialized });
            } else {
                const db = await getDb();
                if (db) await db.put(STORE_NAME, serialized, key);
            }
        } catch (error) {
            console.warn(`[StorageEngine] Failed to set key ${key}`, error);
            // If the connection is closing/closed, reset the promise to force reconnect next time
            if (error?.message?.includes('closing')) {
                _idbPromise = null;
            }
        }
    },

    /**
     * Retrieves and parses a value.
     * @param {string} key 
     * @returns {Promise<any|null>} The parsed value or null if not found.
     */
    async get(key) {
        let serialized = null;
        try {
            if (Capacitor.isNativePlatform()) {
                const { value } = await Preferences.get({ key });
                serialized = value;
            } else {
                const db = await getDb();
                if (db) serialized = await db.get(STORE_NAME, key);
            }
        } catch (error) {
            console.warn(`[StorageEngine] Failed to get key ${key}`, error);
            if (error?.message?.includes('closing')) {
                _idbPromise = null;
            }
            return null;
        }

        if (!serialized) return null;
        try {
            return JSON.parse(serialized);
        } catch (error) {
            console.warn(`[StorageEngine] Corrupted data for key ${key}. Purging entry.`, error);
            await this.remove(key).catch(() => {});
            return null;
        }
    },

    /**
     * Removes a value by key.
     * @param {string} key 
     */
    async remove(key) {
        try {
            if (Capacitor.isNativePlatform()) {
                await Preferences.remove({ key });
            } else {
                const db = await getDb();
                if (db) await db.delete(STORE_NAME, key);
            }
        } catch (error) {
            console.warn(`[StorageEngine] Failed to remove key ${key}`, error);
            if (error?.message?.includes('closing')) {
                _idbPromise = null;
            }
        }
    }
};
