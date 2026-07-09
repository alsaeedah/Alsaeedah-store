import { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { subscribeToProducts } from '../services/productService';

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

    // Real-time synchronization
    useEffect(() => {
        const unsubscribe = subscribeToProducts((payload) => {
            const { eventType, new: newProduct, old: oldProduct } = payload;

            if (eventType === 'INSERT') {
                setCachedProducts(prev => {
                    // Check if product already exists to avoid duplicates
                    if (prev.find(p => p.id === newProduct.id)) return prev;
                    
                    // Format for frontend (consistent with fetch logic if needed)
                    const formatted = {
                        ...newProduct,
                        image: newProduct.imageUrl || (newProduct.images && newProduct.images[0]) || 'https://placehold.co/400x400/1a1a1a/ffffff?text=No+Image'
                    };
                    
                    // Add to the beginning of the list for fresh arrivals
                    return [formatted, ...prev];
                });
            } else if (eventType === 'UPDATE') {
                setCachedProducts(prev => prev.map(p => {
                    if (p.id === newProduct.id) {
                        return {
                            ...p,
                            ...newProduct,
                            image: newProduct.imageUrl || (newProduct.images && newProduct.images[0]) || p.image
                        };
                    }
                    return p;
                }));
            } else if (eventType === 'DELETE') {
                setCachedProducts(prev => prev.filter(p => p.id !== oldProduct.id));
            }
        });

        return () => unsubscribe && unsubscribe();
    }, []);

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
