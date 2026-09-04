// Mock the necessary modules before importing the components under test
import { jest } from '@jest/globals';

jest.mock('../startup/cache', () => ({
    cacheSession: jest.fn(),
    clearCachedSession: jest.fn(),
    getCachedSession: jest.fn().mockResolvedValue(null)
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn()
}));

jest.mock('../storage/EntityStore.js', () => ({
    EntityStore: {
        setMany: jest.fn(),
        remove: jest.fn()
    }
}));

// Now import the modules to test
import { startBackgroundValidation } from '../startup/authSync.js';
import { bootstrapSyncOnce, syncCoordinator } from '../sync/index.js';
import { SyncCoordinator } from '../sync/SyncCoordinator.js';
import { getDoc } from 'firebase/firestore';

describe('Startup & Synchronization Architecture', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset internal module state by resetting the instances or re-importing if possible
        // Since we can't easily reset module-level 'let' vars in Jest without resetModules, 
        // we'll structure our tests to be aware of the state.
    });

    describe('Background Validation Single-Flight', () => {
        it('Test 1: Executes underlying logic exactly once when called concurrently', async () => {
            getDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ is_active: true, role: 'user' })
            });

            const mockUser = { uid: 'user123', email: 'test@test.com', getIdTokenResult: jest.fn().mockResolvedValue({ claims: {} }) };
            const db = {};

            const p1 = startBackgroundValidation(mockUser, db, 'store');
            const p2 = startBackgroundValidation(mockUser, db, 'store');
            const p3 = startBackgroundValidation(mockUser, db, 'store');

            expect(p1).toBe(p2);
            expect(p2).toBe(p3);

            await Promise.all([p1, p2, p3]);

            expect(getDoc).toHaveBeenCalledTimes(1);
        });

        it('Test 2: Promise is cleared on success, allowing future calls', async () => {
            getDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ is_active: true, role: 'user' })
            });

            const mockUser = { uid: 'user123', email: 'test@test.com', getIdTokenResult: jest.fn().mockResolvedValue({ claims: {} }) };
            
            // First call
            await startBackgroundValidation(mockUser, {}, 'store');

            // Second call (should execute again)
            getDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ is_active: true, role: 'user' })
            });

            const p2 = startBackgroundValidation(mockUser, {}, 'store');
            await p2;

            expect(getDoc).toHaveBeenCalledTimes(2);
        });

        it('Test 3: Promise is cleared on failure, allowing retry', async () => {
            // Mock failure
            const mockUser = { uid: 'user123', email: 'test@test.com', getIdTokenResult: jest.fn().mockRejectedValue(new Error('Network error')) };
            
            await startBackgroundValidation(mockUser, {}, 'store');

            // Retry should execute
            mockUser.getIdTokenResult.mockResolvedValueOnce({ claims: {} });
            getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ is_active: true }) });

            await startBackgroundValidation(mockUser, {}, 'store');
            
            expect(getDoc).toHaveBeenCalledTimes(1);
        });
    });

    describe('Bootstrap Sync Single-Flight', () => {
        it('Test 4: Returns same Promise for concurrent calls', () => {
            // Note: Since bootstrapSyncOnce is stateful (bootstrapped flag), we must test this first or reset modules.
            // Assuming this runs first.
            const p1 = bootstrapSyncOnce({}, {});
            const p2 = bootstrapSyncOnce({}, {});
            
            expect(p1).toBe(p2);
            // We don't await here to not trip the 'bootstrapped' flag for other tests, 
            // though Jest might execute them in order.
        });
    });

    describe('SyncCoordinator', () => {
        let coordinator;

        beforeEach(() => {
            coordinator = new SyncCoordinator();
        });

        it('Test 6: Adapter registration is idempotent', () => {
            class MockAdapter {
                getDomain() { return 'mock'; }
            }

            const adapter1 = new MockAdapter();
            const adapter2 = new MockAdapter();

            coordinator.registerAdapter(adapter1);
            coordinator.registerAdapter(adapter2);
            coordinator.registerAdapter(adapter1);

            expect(coordinator.getRegisteredAdapterCount()).toBe(1);
            expect(coordinator.getAdapter('mock')).toBe(adapter1);
        });

        it('Test 7: Sync adapter failure isolation', async () => {
            const successAdapter = {
                getDomain: () => 'success',
                sync: jest.fn().mockResolvedValue()
            };
            const failAdapter = {
                getDomain: () => 'fail',
                sync: jest.fn().mockRejectedValue(new Error('Sync failed'))
            };

            // Mock the engine to just call sync() on the adapter
            coordinator.engine.syncAdapter = jest.fn().mockImplementation(async (a) => {
                if (a.getDomain() === 'fail') throw new Error('Failed');
                return true;
            });

            coordinator.registerAdapter(failAdapter);
            coordinator.registerAdapter(successAdapter);
            
            // Bypass auth guard for test
            coordinator.isReady = true;
            coordinator.connectivity.isOnline = jest.fn().mockResolvedValue(true);

            // Should not throw
            await coordinator.syncAll();

            expect(coordinator.engine.syncAdapter).toHaveBeenCalledWith(failAdapter);
            expect(coordinator.engine.syncAdapter).toHaveBeenCalledWith(successAdapter);
        });

        it('Test 8: Premature sync prevention', async () => {
            // 1. Instantiate (already done in beforeEach, isReady = false)
            
            // 2. Register mock adapters
            const adapter = { getDomain: () => 'mock' };
            coordinator.registerAdapter(adapter);
            coordinator.engine.syncAdapter = jest.fn();
            coordinator.connectivity.isOnline = jest.fn().mockResolvedValue(true);

            // 3. Fire syncAll (simulating connectivity event before auth)
            await coordinator.syncAll();

            // 4. Assert sync did NOT execute
            expect(coordinator.engine.syncAdapter).not.toHaveBeenCalled();

            // 5. Mark ready (simulating successful Background Validation)
            coordinator.markReady({});

            // 6. Fire syncAll again
            await coordinator.syncAll();

            // 7. Assert sync executed
            expect(coordinator.engine.syncAdapter).toHaveBeenCalledTimes(1);
        });
    });
});
