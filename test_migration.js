import { StorageEngine } from './shared/storage/StorageEngine.js';
import { MutationStore } from './shared/sync/mutation/MutationStore.js';

async function testMigration() {
    // 1. Setup mock legacy data
    await StorageEngine.set('product_mutation_queue_v1', [
        {
            id: 'mock_mut_1',
            operation: 'update',
            productId: 'product_123',
            payload: { price: 150 },
            status: 'pending',
            idempotencyKey: 'idemp_1'
        }
    ]);
    
    // 2. Clear new data
    await StorageEngine.remove('mutation_queue_products_v1');
    
    // 3. Load using new Store
    const store = new MutationStore('products');
    const queue = await store.loadQueue();
    
    console.log("Migrated Queue:", JSON.stringify(queue, null, 2));
    
    // 4. Verify legacy is removed
    const legacy = await StorageEngine.get('product_mutation_queue_v1');
    console.log("Legacy Queue after migration (should be null):", legacy);
}

testMigration().catch(console.error);
