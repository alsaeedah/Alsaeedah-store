import { ProductMutationStore } from './ProductMutationStore.js';
import { MutationState, generateIdempotencyKey, generateClientId, MutationOperation } from './ProductMutationTypes.js';
import { ProductMutationSerializer } from './ProductMutationSerializer.js';
import { ProductMutationValidator } from './ProductMutationValidator.js';

export class ProductMutationQueue {
    constructor() {
        this.queue = [];
        this.initialized = false;
        this.listeners = new Set();
    }

    async initialize() {
        if (this.initialized) return;
        this.queue = await ProductMutationStore.loadQueue();
        
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
        await ProductMutationStore.saveQueue(this.queue);
        this._notify();
    }

    /**
     * Enqueues a new mutation.
     * @returns {Promise<Object>} The enqueued mutation record.
     */
    async enqueue(operation, productId, payload, baseVersion = null) {
        if (!this.initialized) await this.initialize();

        const cleanPayload = ProductMutationSerializer.serializePayload(payload);
        ProductMutationValidator.validate(operation, cleanPayload);

        const mutationId = generateClientId();
        const id = productId || generateClientId(); // Generate ID for CREATE

        const record = {
            id: mutationId,
            operation,
            productId: id,
            payload: cleanPayload,
            createdAt: Date.now(),
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
        Object.assign(mut, updates);

        if (status === MutationState.COMPLETED) {
            this.queue = this.queue.filter(m => m.id !== mutationId);
        }

        await this._persist();
    }

    /**
     * Replaces the optimistic state over a given server product or returns a new optimistic product.
     */
    applyOptimisticState(productId, serverProduct = null) {
        if (!this.initialized) return serverProduct;

        const mutations = this.queue.filter(m => m.productId === String(productId) && m.status !== MutationState.CONFLICT);
        
        if (mutations.length === 0) return serverProduct;

        let result = serverProduct ? { ...serverProduct } : null;
        let deleted = false;

        for (const mut of mutations) {
            if (mut.operation === MutationOperation.CREATE) {
                result = { id: mut.productId, ...mut.payload, _isOptimistic: true };
                deleted = false;
            } else if (mut.operation === MutationOperation.UPDATE) {
                if (!result) result = { id: mut.productId };
                result = { ...result, ...mut.payload, _isOptimistic: true };
                deleted = false;
            } else if (mut.operation === MutationOperation.DELETE) {
                deleted = true;
                result = null;
            }
        }

        if (deleted) return { _deleted: true, id: productId };
        return result;
    }

    getPendingMutationsForProduct(productId) {
        return this.queue.filter(m => m.productId === String(productId) && m.status !== MutationState.CONFLICT);
    }

    hasPendingMutations() {
        return this.queue.some(m => m.status === MutationState.PENDING || m.status === MutationState.PROCESSING);
    }
}
