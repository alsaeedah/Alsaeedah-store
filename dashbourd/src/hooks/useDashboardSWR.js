import { useState, useEffect, useCallback, useRef } from 'react';
import { StorageEngine } from '../../../shared/storage/StorageEngine.js';
import { lifecycleCoordinator } from '../../../shared/startup/LifecycleCoordinator.js';

const activeSubscribers = new Map();

lifecycleCoordinator.subscribe((reason) => {
    for (const fetchers of activeSubscribers.values()) {
        fetchers.forEach(execute => {
            try {
                execute(false);
            } catch(e) {}
        });
    }
});

export function useDashboardSWR({
    cacheKey,
    fetcher,        
    dependencies = [], 
    isInitial = true,  
    onSuccess = () => {},
    onError = () => {}
}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [revalidating, setRevalidating] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    
    const cacheKeyRef = useRef(cacheKey);
    const fetcherRef = useRef(fetcher);
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);

    useEffect(() => { cacheKeyRef.current = cacheKey; }, [cacheKey]);
    useEffect(() => { fetcherRef.current = fetcher; }, [fetcher]);
    useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);

    const executeSWR = useCallback(async (isInitialLoad = true, overrideFetcher = null) => {
        const currentCacheKey = cacheKeyRef.current;
        if (!currentCacheKey) return;
        
        let hasValidCache = false;
        let cachedData = null;
        let cachedHasMore = false;
        
        if (isInitialLoad) {
            try {
                const cached = await StorageEngine.get(currentCacheKey);
                if (cached !== null && typeof cached === 'object') {
                    if (cached.data !== undefined) {
                        setData(cached.data);
                        setHasMore(cached.hasMore || false);
                        hasValidCache = true;
                        cachedData = cached.data;
                        cachedHasMore = cached.hasMore;
                        setLoading(false);
                    } else if (Array.isArray(cached) || Object.keys(cached).length > 0) {
                        setData(cached);
                        hasValidCache = true;
                        cachedData = cached;
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.warn("Failed to read cache for", currentCacheKey, err);
            }
        }
        
        if (!hasValidCache && isInitialLoad) {
            setLoading(true);
        } else {
            setRevalidating(true);
        }
        
        try {
            const currentFetcher = overrideFetcher || fetcherRef.current;
            const result = await currentFetcher(hasValidCache ? cachedData : null);
            
            if (result && result.snapshot && result.snapshot.metadata && result.snapshot.metadata.fromCache) {
                if (result.snapshot.empty && hasValidCache) {
                    console.warn(`[useDashboardSWR] Protected LKG for ${currentCacheKey}: Firebase returned empty fromCache snapshot.`);
                    if (isInitialLoad) setLoading(false);
                    setRevalidating(false);
                    return { data: cachedData, hasMore: cachedHasMore, isProtected: true };
                }
            }
            
            const finalData = result && result.data !== undefined ? result.data : result;
            const finalHasMore = result && result.hasMore !== undefined ? result.hasMore : false;
            
            // Check if the visual data actually changed (ignoring lastSyncAt checkpoint)
            const isDataChanged = (() => {
                if (!finalData || !cachedData) return true;
                if (typeof finalData === 'object' && typeof cachedData === 'object') {
                    if (finalData.stats && finalData.recentOrders) {
                        const { lastSyncAt: l1, ...d1 } = finalData;
                        const { lastSyncAt: l2, ...d2 } = cachedData;
                        return JSON.stringify(d1) !== JSON.stringify(d2);
                    }
                }
                return JSON.stringify(finalData) !== JSON.stringify(cachedData);
            })();
            
            const isHasMoreChanged = finalHasMore !== cachedHasMore;

            // Always save the cache if there is a new lastSyncAt or data change
            const needsCacheWrite = isDataChanged || isHasMoreChanged || !hasValidCache || (finalData?.lastSyncAt !== cachedData?.lastSyncAt);

            if (needsCacheWrite) {
                StorageEngine.set(currentCacheKey, {
                    data: finalData,
                    hasMore: finalHasMore,
                    timestamp: Date.now()
                }).catch(e => console.warn("Cache write failed", e));
            }

            if (isDataChanged || isHasMoreChanged || !hasValidCache) {
                setData(finalData);
                setHasMore(finalHasMore);
                onSuccessRef.current(finalData);
            }
            
            return { data: finalData, hasMore: finalHasMore, isProtected: false };
            
        } catch (err) {
            console.error(`[useDashboardSWR] Background fetch failed for ${currentCacheKey}:`, err);
            if (!hasValidCache) {
                setError(err);
                onErrorRef.current(err);
            }
            return { data: hasValidCache ? cachedData : null, hasMore: cachedHasMore, error: err };
        } finally {
            if (isInitialLoad) setLoading(false);
            setRevalidating(false);
        }
    }, []); // executeSWR never changes identity now

    // Mount and dependencies effect
    // We use JSON.stringify to deeply compare dependencies and trigger a refetch if they change, 
    // or we can just spread them. Since it's a hook, spreading works if the caller uses stable primitives.
    const mountedRef = useRef(false);
    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            if (isInitial) {
                executeSWR(true);
            }
        } else {
            // If dependencies change after mount and isInitial is true, re-run
            if (isInitial && dependencies.length > 0) {
                executeSWR(true);
            }
        }
        
        // Register for lifecycle revalidation
        if (cacheKey) {
            if (!activeSubscribers.has(cacheKey)) {
                activeSubscribers.set(cacheKey, new Set());
            }
            activeSubscribers.get(cacheKey).add(executeSWR);
            
            return () => {
                const fetchers = activeSubscribers.get(cacheKey);
                if (fetchers) {
                    fetchers.delete(executeSWR);
                    if (fetchers.size === 0) {
                        activeSubscribers.delete(cacheKey);
                    }
                }
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...dependencies, isInitial, executeSWR, cacheKey]);

    return {
        data,
        setData,
        loading,
        revalidating,
        error,
        hasMore,
        executeSWR
    };
}
