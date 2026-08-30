import { Network } from '@capacitor/network';

export class AndroidAdapter {
    constructor() {
        this.listeners = new Set();
        this._initListener();
    }

    async _initListener() {
        await Network.addListener('networkStatusChange', status => {
            this._notifyListeners({ connected: status.connected });
        });
    }

    async isOnline() {
        const status = await Network.getStatus();
        return status.connected;
    }

    async getCurrentStatus() {
        const status = await Network.getStatus();
        return { connected: status.connected };
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
