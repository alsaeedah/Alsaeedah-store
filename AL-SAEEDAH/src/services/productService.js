
import { supabase } from '../supabase/client';

export const fetchProductsFromFirestore = async () => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products:', error);
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Unexpected error fetching products:', error);
        return [];
    }
};

export const fetchLatestProducts = async () => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_latest', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Error in fetchLatestProducts:', error);
        return [];
    }
};

export const fetchBestSellers = async () => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_best_seller', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        return [];
    }
};

export const fetchProductsPaginated = async (page = 0, pageSize = 6, filters = {}) => {
    try {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        // If random sorting is requested (default)
        if (filters.sortPrice === 'none' && filters.seed) {
            try {
                const { data, error } = await supabase.rpc('get_random_products', {
                    p_seed: filters.seed,
                    p_offset: from,
                    p_limit: pageSize,
                    p_category: filters.category || 'all',
                    p_style: filters.style || 'all',
                    p_min_price: filters.minPrice || null,
                    p_max_price: filters.maxPrice || null,
                    p_search: filters.search || null
                });

                if (!error && data) {
                    return {
                        products: data || [],
                        // Simplified hasMore: if we got exactly pageSize, there's likely more
                        hasMore: data.length === pageSize, 
                        total: 0 // We don't have the exact total anymore but hasMore works for the UI
                    };
                }
                
                if (error) {
                    console.warn('RPC random sort failed, falling back to standard sorting:', error.message);
                }
            } catch (rpcError) {
                console.error('RPC Error:', rpcError);
            }
        }

        // Standard filtering (Fallback or explicit sorting)
        let query = supabase
            .from('products')
            .select('*', { count: 'exact' });

        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }
        if (filters.style && filters.style !== 'all') {
            query = query.eq('style', filters.style);
        }
        if (filters.minPrice) {
            query = query.gte('price', filters.minPrice);
        }
        if (filters.maxPrice) {
            query = query.lte('price', filters.maxPrice);
        }
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,displayId.ilike.%${filters.search}%`);
        }

        if (filters.sortPrice === 'asc') {
            query = query.order('price', { ascending: true });
        } else if (filters.sortPrice === 'desc') {
            query = query.order('price', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error, count } = await query.range(from, to);

        if (error) throw error;

        return {
            products: data || [],
            hasMore: count > to,
            total: count
        };
    } catch (error) {
        console.error('Error in fetchProductsPaginated:', error);
        return { products: [], hasMore: false, total: 0 };
    }
};

export const subscribeToProducts = (callback) => {
    // Unique channel name per subscription to avoid conflicts
    const channelId = `products-changes-${Math.random().toString(36).substring(7)}`;
    const subscription = supabase
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
            console.log('Change received in channel:', channelId, payload);
            callback(payload);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
};

export const subscribeToProduct = (id, callback) => {
    const fetchProduct = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching product:', error);
            callback(null);
        } else {
            callback(data);
        }
    };

    fetchProduct();

    const subscription = supabase
        .channel(`public:products:id=eq.${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `id=eq.${id}` }, (payload) => {
            fetchProduct();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
};

export const subscribeToHero = (callback) => {
    const fetchHero = async () => {
        const { data, error } = await supabase
            .from('hero')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching hero:', error);
        } else {
            callback(data || []);
        }
    };

    fetchHero();

    const subscription = supabase
        .channel('public:hero')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hero' }, (payload) => {
            console.log('Hero change received!', payload);
            fetchHero();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
};
