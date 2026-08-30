export class ProductConnectivityMonitor {
    constructor() {
        this.listeners = new Set();
        this._isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        this._handleOnline = this._handleOnline.bind(this);
        this._handleOffline = this._handleOffline.bind(this);
    }

    start() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', this._handleOnline);
            window.addEventListener('offline', this._handleOffline);
            // Refresh current state just in case it changed before start()
            this._isOnline = navigator.onLine;
        }
    }

    stop() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('online', this._handleOnline);
            window.removeEventListener('offline', this._handleOffline);
        }
    }

    _handleOnline() {
        if (!this._isOnline) {
            this._isOnline = true;
            this.listeners.forEach(fn => fn(true));
        }
    }

    _handleOffline() {
        if (this._isOnline) {
            this._isOnline = false;
            this.listeners.forEach(fn => fn(false));
        }
    }

    onConnectivityChanged(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    isOnline() {
        return this._isOnline;
    }
}
