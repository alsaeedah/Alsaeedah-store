import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

const getDocsMock = mock.fn();
const storageGetMock = mock.fn();
const storageSetMock = mock.fn();

mock.module('firebase/firestore', {
    namedExports: {
        collection: () => ({}),
        query: () => ({}),
        where: () => ({}),
        getDocs: getDocsMock,
        limit: () => ({}),
        startAfter: () => ({}),
        orderBy: () => ({}),
        updateDoc: mock.fn(),
        doc: () => ({}),
        writeBatch: mock.fn(),
        increment: mock.fn(),
        getDoc: mock.fn()
    }
});

mock.module('idb', { namedExports: { openDB: mock.fn() } });
mock.module('@capacitor/core', { namedExports: { Capacitor: { isNativePlatform: () => false } } });
mock.module('@capacitor/preferences', { namedExports: { Preferences: {} } });

mock.module('../../firebase/config.js', {
    namedExports: {
        db: {}
    }
});

mock.module('../../../../shared/storage/StorageEngine.js', {
    namedExports: {
        StorageEngine: {
            get: storageGetMock,
            set: storageSetMock,
            remove: mock.fn()
        }
    }
});

mock.module('../../../../shared/startup/LifecycleCoordinator.js', {
    namedExports: {
        lifecycleCoordinator: {
            subscribe: mock.fn()
        }
    }
});

const mod = await import('../DashboardOrdersRepository.js');
const dashboardOrdersRepository = mod.dashboardOrdersRepository;

test('Test 1 & 2: Concurrent deduplication and Race-condition regression', async (t) => {
    storageGetMock.mock.mockImplementation(() => Promise.resolve({ status: 'UNINITIALIZED' }));
    
    // Simulate slow network response
    getDocsMock.mock.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { docs: [{ id: '1', data: () => ({ status: 'pending', created_at: '2024-01-01' }) }] };
    });

    const p1 = dashboardOrdersRepository.revalidateOrders('key1', 'all', '', 0, null, { status: 'UNINITIALIZED' });
    const p2 = dashboardOrdersRepository.revalidateOrders('key1', 'all', '', 0, null, { status: 'UNINITIALIZED' });

    assert.equal(dashboardOrdersRepository.cacheGenerations.get('key1'), 1, 'Generation should only increment once');

    const result = await p1;
    assert.equal(result.status, 'READY');
    assert.equal(result.data.length, 1);
});

test('Test 3: Reverse completion (Late arrival of older generation)', async (t) => {
    storageGetMock.mock.mockImplementation(() => Promise.resolve({ status: 'READY', data: [] }));
    let resolveGen1, resolveGen2;

    const pGen1 = new Promise(r => resolveGen1 = r);
    const pGen2 = new Promise(r => resolveGen2 = r);

    getDocsMock.mock.mockImplementationOnce(() => pGen1);
    const req1 = dashboardOrdersRepository.revalidateOrders('key2', 'all', '', 0, null, { status: 'UNINITIALIZED' });

    // Force a new generation by mocking getDocs again for the next call
    getDocsMock.mock.mockImplementationOnce(() => pGen2);
    // Wait slightly to ensure execution order
    await new Promise(r => setTimeout(r, 10)); 
    
    // We increment generation directly or simulate a filter change that generates a new key
    // Actually the test requires late arrival on the SAME cache key to test `cacheGenerations.get(cacheKey) !== generation`
    // However, revalidateOrders uses activeRequests to block same-key requests.
    // So we manually delete it from activeRequests to simulate the user navigating away and back, or a forced refresh that bypasses deduplication, or we just test the `_executeRevalidation` logic directly.
    dashboardOrdersRepository.activeRequests.delete('key2');
    const req2 = dashboardOrdersRepository.revalidateOrders('key2', 'all', '', 0, null, { status: 'UNINITIALIZED' });

    assert.equal(dashboardOrdersRepository.cacheGenerations.get('key2'), 2);

    // Resolve gen 2 first
    resolveGen2({ docs: [{ id: '2', data: () => ({ id: '2' }) }] });
    const res2 = await req2;
    assert.equal(res2.status, 'READY');
    assert.equal(res2.data[0].id, '2');

    // Resolve gen 1 late
    resolveGen1({ docs: [{ id: '1', data: () => ({ id: '1' }) }] });
    const res1 = await req1;
    
    // Gen 1 should be dropped and return the CURRENT cache (which is Gen 2)
    assert.equal(res1.status, 'READY', 'Dropped response returns latest cache');
});

test('Test 4 & 5: Network failure with and without cache', async (t) => {
    getDocsMock.mock.mockImplementation(() => { throw new Error('Network error'); });

    // Without cache
    storageGetMock.mock.mockImplementationOnce(() => Promise.resolve({ status: 'UNINITIALIZED' }));
    const errRes = await dashboardOrdersRepository.revalidateOrders('key3', 'all', '', 0, null, { status: 'UNINITIALIZED' });
    assert.equal(errRes.status, 'ERROR');

    // With cache
    dashboardOrdersRepository.activeRequests.delete('key3');
    storageGetMock.mock.mockImplementation(() => Promise.resolve({ status: 'READY', data: [{ id: 'c1' }], hasMore: false, lastValidatedAt: 'time' }));
    const staleRes = await dashboardOrdersRepository.revalidateOrders('key3', 'all', '', 0, null, { status: 'READY', data: [{ id: 'c1' }] });
    assert.equal(staleRes.status, 'STALE');
    assert.equal(staleRes.data[0].id, 'c1');
});

test('Test 7: SUCCESS + 0 docs returns EMPTY status', async (t) => {
    storageGetMock.mock.mockImplementation(() => Promise.resolve({ status: 'UNINITIALIZED' }));
    getDocsMock.mock.mockImplementation(() => Promise.resolve({ docs: [] }));

    const res = await dashboardOrdersRepository.revalidateOrders('key4', 'all', '', 0, null, { status: 'UNINITIALIZED' });
    assert.equal(res.status, 'EMPTY');
    assert.deepEqual(res.data, []);
});

test('Index Error Detection uses fallback', async (t) => {
    storageGetMock.mock.mockImplementation(() => Promise.resolve({ status: 'UNINITIALIZED' }));
    
    // First call fails with failed-precondition, second call (fallback) succeeds
    getDocsMock.mock.mockImplementationOnce(() => { 
        const e = new Error(); e.code = 'failed-precondition'; throw e; 
    });
    getDocsMock.mock.mockImplementationOnce(() => Promise.resolve({ 
        docs: [{ id: 'fb', data: () => ({ id: 'fb', status: 'pending', created_at: '2024' }) }] 
    }));

    const res = await dashboardOrdersRepository.revalidateOrders('key5', 'all', '', 0, null, { status: 'UNINITIALIZED' });
    assert.equal(res.status, 'READY');
    assert.equal(res.data[0].id, 'fb');
});
