import { MutationStore } from './MutationStore.js';
import { MutationState, generateIdempotencyKey, generateClientId, MutationOperation } from './MutationTypes.js';
import { MutationSerializer } from './MutationSerializer.js';

export class MutationQueue {
    constructor(domain) {
        this.domain = domain;
        this.store = new MutationStore(domain);
        this.queue = [];
        this.initialized = false;
        this.listeners = new Set();
    }

    async initialize() {
        if (this.initialized) return;
        this.queue = await this.store.loadQueue();
        
        // Recover abandoned PROCESSING mutations on startup
        let changed = false;
        const now = Date.now();
        const LEASE_TIMEOUT = 60000; // 60 seconds

        for (const mut of this.queue) {
            if (mut.status === MutationState.PROCESSING) {
                if (now - (mut.lastAttemptAt || 0) > LEASE_TIMEOUT) {
                    mut.status = MutationState.PENDING;
                    changed = true;
                }
            }
        }

        if (changed) {
            await this._persist();
        }
        
        this.initialized = true;
    }

    _notify() {
        this.listeners.forEach(fn => fn());
    }

    onQueueChanged(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    async _persist() {
        await this.store.saveQueue(this.queue);
        this._notify();
    }

    /**
     * Enqueues a new mutation.
     * @returns {Promise<Object>} The enqueued mutation record.
     */
    async enqueue(operation, documentId, payload, baseVersion = null) {
        if (!this.initialized) await this.initialize();

        const cleanPayload = MutationSerializer.serializePayload(payload);

        const mutationId = generateClientId();
        const id = documentId || generateClientId(); // Generate ID for CREATE if missing

        const record = {
            id: mutationId,
            domain: this.domain,
            collection: this.domain,
            documentId: id,
            operation,
            payload: cleanPayload,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: MutationState.PENDING,
            retryCount: 0,
            nextRetryAt: null,
            lastAttemptAt: null,
            lastError: null,
            idempotencyKey: generateIdempotencyKey(),
            baseVersion
        };

        this.queue.push(record);
        await this._persist();
        return record;
    }

    /**
     * Enqueues a batch of mutations to be executed atomically.
     * @param {Array<{operation: string, documentId: string, payload: any, baseVersion: any, collection: string}>} operations 
     */
    async enqueueBatch(operations) {
        if (!this.initialized) await this.initialize();
        
        const serializedOps = operations.map(op => ({
            ...op,
            payload: MutationSerializer.serializePayload(op.payload),
            documentId: op.documentId || generateClientId()
        }));

        const mutationId = generateClientId();

        const record = {
            id: mutationId,
            domain: this.domain,
            collection: this.domain, // Primary domain
            documentId: mutationId, // dummy ID for the batch
            operation: MutationOperation.BATCH,
            payload: { operations: serializedOps },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: MutationState.PENDING,
            retryCount: 0,
            nextRetryAt: null,
            lastAttemptAt: null,
            lastError: null,
            idempotencyKey: generateIdempotencyKey(),
            baseVersion: null
        };

        this.queue.push(record);
        await this._persist();
        return record;
    }

    /**
     * Retrieves the next eligible mutation for processing.
     */
    getNextEligible() {
        const now = Date.now();
        return this.queue.find(mut => 
            mut.status === MutationState.PENDING &&
            (!mut.nextRetryAt || mut.nextRetryAt <= now)
        );
    }

    async updateStatus(mutationId, status, updates = {}) {
        const mut = this.queue.find(m => m.id === mutationId);
        if (!mut) return;

        mut.status = status;
        mut.updatedAt = Date.now();
        Object.assign(mut, updates);

        if (status === MutationState.COMPLETED) {
            this.queue = this.queue.filter(m => m.id !== mutationId);
        }

        await this._persist();
    }

    getPendingMutationsForDocument(documentId) {
        return this.queue.filter(m => String(m.documentId) === String(documentId) && m.status !== MutationState.CONFLICT);
    }

    getAllPendingMutations() {
        return this.queue.filter(m => m.status !== MutationState.CONFLICT);
    }

    hasPendingMutations() {
        return this.queue.some(m => m.status === MutationState.PENDING || m.status === MutationState.PROCESSING);
    }
}
