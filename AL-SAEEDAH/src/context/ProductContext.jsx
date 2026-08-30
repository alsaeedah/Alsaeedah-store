import { createContext, useState, useContext, useCallback, useEffect } from 'react';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
    const [cachedProducts, setCachedProducts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState({
        category: 'all',
        style: 'all',
        sortPrice: 'none',
        minPrice: '',
        maxPrice: ''
    });
    const [scrollPosition, setScrollPosition] = useState(0);

    const updateCachedProducts = useCallback((newProducts, append = true) => {
        if (append) {
            setCachedProducts(prev => {
                // Filter out duplicates just in case
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newProducts.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNew];
            });
        } else {
            setCachedProducts(newProducts);
        }
    }, []);

    const resetCache = useCallback(() => {
        setCachedProducts([]);
        setCurrentPage(0);
        setHasMore(true);
    }, []);

    const findProductInCache = useCallback((id) => {
        return cachedProducts.find(p => p.id === id);
    }, [cachedProducts]);

    return (
        <ProductContext.Provider value={{
            cachedProducts,
            updateCachedProducts,
            hasMore,
            setHasMore,
            currentPage,
            setCurrentPage,
            filters,
            setFilters,
            resetCache,
            findProductInCache,
            scrollPosition,
            setScrollPosition
        }}>
            {children}
        </ProductContext.Provider>
    );
};
