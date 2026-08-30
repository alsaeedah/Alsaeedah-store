export class WebAdapter {
    constructor() {
        this.listeners = new Set();

        window.addEventListener('online', () => this._notifyListeners({ connected: true }));
        window.addEventListener('offline', () => this._notifyListeners({ connected: false }));
    }

    async isOnline() {
        return window.navigator.onLine;
    }

    async getCurrentStatus() {
        return { connected: window.navigator.onLine };
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return {
            remove: () => {
                this.listeners.delete(listener);
            }
        };
    }

    _notifyListeners(status) {
        this.listeners.forEach(listener => {
            try {
                listener(status);
            } catch (err) {
                console.error('Connectivity listener error:', err);
            }
        });
    }
}
