import { useState, useEffect } from 'react';

const RECENT_SEARCHES_KEY = 'alsaedah_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function useRecentSearches() {
    const [recentSearches, setRecentSearches] = useState([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) {
                setRecentSearches(JSON.parse(stored));
            }
        } catch (e) {
            console.warn('Failed to parse recent searches', e);
        }
    }, []);

    const addRecentSearch = (term) => {
        if (!term || !term.trim()) return;
        const cleanTerm = term.trim();
        
        setRecentSearches(prev => {
            // Remove if exists to push to top
            const filtered = prev.filter(s => s.toLowerCase() !== cleanTerm.toLowerCase());
            const updated = [cleanTerm, ...filtered].slice(0, MAX_RECENT_SEARCHES);
            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            } catch (e) {}
            return updated;
        });
    };

    const removeRecentSearch = (term) => {
        setRecentSearches(prev => {
            const updated = prev.filter(s => s !== term);
            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            } catch (e) {}
            return updated;
        });
    };

    const clearAllSearches = () => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch (e) {}
    };

    return {
        recentSearches,
        addRecentSearch,
        removeRecentSearch,
        clearAllSearches
    };
}
