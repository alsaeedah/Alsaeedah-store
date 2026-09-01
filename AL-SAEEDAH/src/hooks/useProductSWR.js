import { useState, useEffect } from 'react';
import { productRepository } from '../services/productService';

export const useBestSellers = (limitCount = 6) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        
        const unsubscribe = productRepository.subscribeToBestSellersSWR(limitCount, (newData) => {
            if (isMounted) {
                setData(newData || []);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [limitCount]);

    return { data, loading };
};

export const useLatestProducts = (limitCount = 6) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        
        const unsubscribe = productRepository.subscribeToLatestSWR(limitCount, (newData) => {
            if (isMounted) {
                setData(newData || []);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [limitCount]);

    return { data, loading };
};

export const useProductDetail = (id) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        let isMounted = true;
        setLoading(true);
        
        const unsubscribe = productRepository.subscribeToDetailSWR(id, (newData) => {
            if (isMounted) {
                setProduct(newData);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [id]);

    return { product, loading };
};

export const useRelatedProducts = (id, limitCount = 12) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        let isMounted = true;
        setLoading(true);
        
        const unsubscribe = productRepository.subscribeToRelatedSWR(id, limitCount, (newData) => {
            if (isMounted) {
                setData(newData || []);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [id, limitCount]);

    return { data, loading };
};
