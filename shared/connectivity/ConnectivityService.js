import { Capacitor } from '@capacitor/core';
import { WebAdapter } from './WebAdapter.js';
import { AndroidAdapter } from './AndroidAdapter.js';

export class OfflineError extends Error {
    constructor(message = 'تحقق من اتصالك بالإنترنت') {
        super(message);
        this.name = 'OfflineError';
    }
}

class ConnectivityService {
    static _instance = null;

    static getInstance() {
        if (!ConnectivityService._instance) {
            ConnectivityService._instance = new ConnectivityService();
        }
        return ConnectivityService._instance;
    }

    constructor() {
        this.adapter = Capacitor.isNativePlatform() ? new AndroidAdapter() : new WebAdapter();
        this.lastStatus = null;
        this.debounceTimeout = null;
    }

    async isOnline() {
        return this.adapter.isOnline();
    }
    
    async requireOnline() {
        const online = await this.isOnline();
        if (!online) {
            throw new OfflineError();
        }
    }

    async getCurrentStatus() {
        return this.adapter.getCurrentStatus();
    }

    subscribe(listener) {
        return this.adapter.subscribe(({ connected }) => {
            // Deduplicate consecutive identical events
            if (this.lastStatus === connected) return;
            this.lastStatus = connected;

            // Debounce rapid flapping (e.g. offline -> online -> offline -> online)
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }

            this.debounceTimeout = setTimeout(() => {
                listener({ connected });
                this.debounceTimeout = null;
            }, 1000); // 1 second debounce
        });
    }
}

export { ConnectivityService };
