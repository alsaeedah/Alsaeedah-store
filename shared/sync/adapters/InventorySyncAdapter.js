import { BaseSyncAdapter } from './BaseSyncAdapter.js';
export class InventorySyncAdapter extends BaseSyncAdapter {
    constructor(db) { super(); this.db = db; }
    getDomain() { return 'inventory'; }
    async executeMutation(m) { throw new Error('Not implemented'); }
    async syncInbound(lastSyncAt, syncBoundary) { return true; }
}
