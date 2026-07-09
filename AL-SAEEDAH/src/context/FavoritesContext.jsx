import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabase/client';

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // 1. Fetch Favorites from Supabase
    const fetchFavorites = useCallback(async (userId) => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;
            
            // Map the rows to our standard product objects
            const favProducts = data.map(item => ({
                ...item.product_data,
                id: item.product_id // Ensure ID consistency
            }));
            
            if (favProducts.length > 0) {
                const productIds = favProducts.map(p => p.id);
                const { data: latestProducts, error: latestError } = await supabase
                    .from('products')
                    .select('id, name, price, old_price, imageUrl, images, variants')
                    .in('id', productIds);
                    
                if (!latestError && latestProducts) {
                    const hydratedFavs = favProducts.map(item => {
                        const latest = latestProducts.find(p => String(p.id) === String(item.id));
                        if (!latest) return null;
                        return {
                            ...item,
                            name: latest.name || item.name,
                            price: latest.price ?? item.price,
                            old_price: latest.old_price ?? item.old_price,
                            imageUrl: latest.imageUrl || item.imageUrl,
                            image: latest.imageUrl || (latest.images?.[0]) || item.image,
                            images: latest.images ?? item.images,
                            variants: latest.variants ?? item.variants,
                        };
                    }).filter(Boolean);
                    setFavorites(hydratedFavs);
                    return;
                }
            }
            
            setFavorites(favProducts);
        } catch (err) {
            console.error("Error fetching favorites:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Real-time listener for product/favorites deletions
    useEffect(() => {
        const favoritesChannel = supabase
            .channel('favorites_sync_final')
            // Listener 1: Watch products table (direct deletion)
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'products' },
                (payload) => {
                    const deletedId = payload.old?.id;
                    if (!deletedId) return;

                    // Update local state for everyone (Guests & Logged-in)
                    setFavorites(prev => prev.filter(item => {
                        const itemId = String(item.id || item.product_id || '').trim();
                        const targetId = String(deletedId).trim();
                        return itemId !== targetId;
                    }));
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'products' },
                (payload) => {
                    const updatedProduct = payload.new;
                    if (!updatedProduct) return;
                    setFavorites(prev => prev.map(item => {
                        const itemId = String(item.id || item.product_id || '').trim();
                        const updatedId = String(updatedProduct.id).trim();
                        if (itemId === updatedId) {
                            return {
                                ...item,
                                name: updatedProduct.name || item.name,
                                price: updatedProduct.price ?? item.price,
                                old_price: updatedProduct.old_price ?? item.old_price,
                                imageUrl: updatedProduct.imageUrl || item.imageUrl,
                                image: updatedProduct.imageUrl || (updatedProduct.images?.[0]) || item.image,
                                images: updatedProduct.images ?? item.images,
                                variants: updatedProduct.variants ?? item.variants,
                            };
                        }
                        return item;
                    }));
                }
            )
            // Listener 2: Watch favorites table (cascade/direct deletion)
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'favorites' },
                (payload) => {
                    const deletedProductId = payload.old?.product_id;
                    const deletedUserId = payload.old?.user_id;

                    // Safeguard: only apply to current user's favorites
                    if (currentUser && deletedUserId && String(deletedUserId) !== String(currentUser.uid)) {
                        return;
                    }

                    if (!deletedProductId) return;
                    
                    // Update local state
                    setFavorites(prev => prev.filter(item => {
                        const itemId = String(item.id || item.product_id || '').trim();
                        const targetId = String(deletedProductId).trim();
                        return itemId !== targetId;
                    }));
                }
            )
            // Listener 3: Watch favorites table (inserts from other tabs/devices)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'favorites' },
                (payload) => {
                    const newFav = payload.new;
                    if (!newFav) return;

                    // Only apply if it belongs to the current user
                    if (currentUser && String(newFav.user_id) === String(currentUser.uid)) {
                        const productData = newFav.product_data;
                        if (!productData) return;

                        const formattedProduct = {
                            ...productData,
                            id: newFav.product_id // Ensure ID consistency
                        };

                        setFavorites(prev => {
                            const exists = prev.some(item => String(item.id) === String(formattedProduct.id));
                            if (exists) return prev;
                            return [...prev, formattedProduct];
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(favoritesChannel);
        };
    }, [currentUser]); // fetchFavorites removed from deps as it's no longer called here

    // 2. Merge Local Favorites to Database on Login
    const mergeLocalFavorites = async (userId) => {
        const localFavs = localStorage.getItem('time-tick-favorites');
        if (!localFavs || !userId) return;

        try {
            const parsed = JSON.parse(localFavs);
            if (parsed.length === 0) return;

            const upserts = parsed.map(product => ({
                user_id: userId,
                product_id: String(product.id),
                product_data: product
            }));

            const { error } = await supabase
                .from('favorites')
                .upsert(upserts, { onConflict: 'user_id, product_id' });

            if (error) throw error;
            
            // Clear local storage after successful merge
            localStorage.removeItem('time-tick-favorites');
            await fetchFavorites(userId);
        } catch (err) {
            console.error("Error merging favorites:", err);
        }
    };

    // 3. Initial Load & Auth Sync
    useEffect(() => {
        if (currentUser) {
            // Always fetch from cloud when user is logged in
            fetchFavorites(currentUser.uid);
            // Also attempt to merge any guest favorites
            mergeLocalFavorites(currentUser.uid);
        } else {
            // Load from local storage for guests
            const saved = localStorage.getItem('time-tick-favorites');
            if (saved) {
                const parsedFavs = JSON.parse(saved);
                if (parsedFavs.length > 0) {
                    const hydrateGuestFavorites = async () => {
                        const productIds = parsedFavs.map(p => p?.id).filter(Boolean);
                        try {
                            const { data, error } = await supabase
                                .from('products')
                                .select('id, name, price, old_price, imageUrl, images, variants')
                                .in('id', productIds);
                                
                            if (!error && data) {
                                const hydrated = parsedFavs.map(item => {
                                    const latest = data.find(p => String(p.id) === String(item.id));
                                    if (!latest) return null; // Remove if deleted
                                    return {
                                        ...item,
                                        name: latest.name || item.name,
                                        price: latest.price ?? item.price,
                                        old_price: latest.old_price ?? item.old_price,
                                        imageUrl: latest.imageUrl || item.imageUrl,
                                        image: latest.imageUrl || (latest.images?.[0]) || item.image,
                                        images: latest.images ?? item.images,
                                        variants: latest.variants ?? item.variants,
                                    };
                                }).filter(Boolean);
                                setFavorites(hydrated);
                                return;
                            }
                        } catch (e) {
                            console.error("Hydration error:", e);
                        }
                        setFavorites(parsedFavs);
                    };
                    hydrateGuestFavorites();
                } else {
                    setFavorites([]);
                }
            } else {
                setFavorites([]);
            }
        }
    }, [currentUser, fetchFavorites]);

    // 4. Persistence Effect (Guests Only)
    useEffect(() => {
        if (!currentUser) {
            localStorage.setItem('time-tick-favorites', JSON.stringify(favorites));
        }
    }, [favorites, currentUser]);

    const toggleFavorite = async (product) => {
        const isFav = favorites.some(fav => String(fav.id) === String(product.id));
        
        // Capture previous state for potential rollback
        const previousFavs = [...favorites];
        
        // Calculate new state immediately
        const newFavs = isFav 
            ? favorites.filter(fav => String(fav.id) !== String(product.id))
            : [...favorites, product];

        // 1. Update UI Immediately (Optimistic Update)
        setFavorites(newFavs);

        // 2. Persist to storage/database in background
        if (currentUser) {
            try {
                if (isFav) {
                    const { error } = await supabase
                        .from('favorites')
                        .delete()
                        .eq('user_id', currentUser.uid)
                        .eq('product_id', String(product.id));
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('favorites')
                        .insert({
                            user_id: currentUser.uid,
                            product_id: String(product.id),
                            product_data: product
                        });
                    if (error) throw error;
                }
            } catch (err) {
                console.error("Failed to sync favorites with database:", err);
                // 3. Rollback on failure
                setFavorites(previousFavs);
                alert("حدث خطأ أثناء مزامنة المفضلة. تم التراجع عن التغيير.");
            }
        } else {
            // Guest mode logic is already handled by the useEffect watching favorites
            localStorage.setItem('time-tick-favorites', JSON.stringify(newFavs));
        }
    };

    const isFavorite = (productId) => favorites.some(fav => String(fav.id) === String(productId));

    // Fetch the latest data for a single product, update favorites state, and
    // return the fresh product object. Called by FavoritesModal right before
    // opening the Order Customization modal so the customer always sees the
    // most up-to-date images and variants without any stale-closure issues.
    const refreshFavoriteProduct = useCallback(async (productId) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, price, old_price, imageUrl, images, variants')
                .eq('id', productId)
                .single();
            if (error || !data) return null;

            const freshItem = (existingItem) => ({
                ...existingItem,
                name: data.name || existingItem.name,
                price: data.price ?? existingItem.price,
                old_price: data.old_price ?? existingItem.old_price,
                imageUrl: data.imageUrl || existingItem.imageUrl,
                image: data.imageUrl || (data.images?.[0]) || existingItem.image,
                images: data.images ?? existingItem.images,
                variants: data.variants ?? existingItem.variants,
            });

            let freshProduct = null;
            setFavorites(prev => prev.map(item => {
                if (String(item.id) !== String(productId)) return item;
                const updated = freshItem(item);
                freshProduct = updated;
                return updated;
            }));
            // Return the freshly-built object so callers avoid stale closure
            return freshProduct;
        } catch (err) {
            console.error('Error refreshing favorite product:', err);
            return null;
        }
    }, []);

    return (
        <FavoritesContext.Provider value={{
            favorites,
            toggleFavorite,
            isFavorite,
            isFavoritesOpen,
            setIsFavoritesOpen,
            loading,
            refreshFavoriteProduct
        }}>
            {children}
        </FavoritesContext.Provider>
    );
};
