import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { openDB } from 'idb';

const DB_NAME = 'AL_SAEEDAH_CACHE';
const STORE_NAME = 'taxonomy_cache';

let idbPromise = null;

if (!Capacitor.isNativePlatform()) {
    idbPromise = openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });
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
        const serialized = JSON.stringify(value);
        if (Capacitor.isNativePlatform()) {
            await Preferences.set({ key, value: serialized });
        } else {
            const db = await idbPromise;
            await db.put(STORE_NAME, serialized, key);
        }
    },

    /**
     * Retrieves and parses a value.
     * @param {string} key 
     * @returns {Promise<any|null>} The parsed value or null if not found.
     */
    async get(key) {
        let serialized = null;
        if (Capacitor.isNativePlatform()) {
            const { value } = await Preferences.get({ key });
            serialized = value;
        } else {
            const db = await idbPromise;
            serialized = await db.get(STORE_NAME, key);
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
        if (Capacitor.isNativePlatform()) {
            await Preferences.remove({ key });
        } else {
            const db = await idbPromise;
            await db.delete(STORE_NAME, key);
        }
    }
};
