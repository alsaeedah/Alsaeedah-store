import { BaseSyncAdapter } from './BaseSyncAdapter.js';
export class SettingsSyncAdapter extends BaseSyncAdapter {
    constructor(db) { super(); this.db = db; }
    getDomain() { return 'settings'; }
    async executeMutation(m) { throw new Error('Not implemented'); }
    async syncInbound(lastSyncAt, syncBoundary) { return true; }
}
