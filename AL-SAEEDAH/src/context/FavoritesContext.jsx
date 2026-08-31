import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { fetchProductsByIds, productRepository } from '../services/productService';

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const openWishlist = () => navigate('/wishlist');
    
    // 1. Auth Sync & Initialization
    useEffect(() => {
        let dalUnsubscribe = null;

        const initializeAuthFavorites = async (uid) => {
            setLoading(true);
            try {
                // Step 1: Initialize DAL
                const { FavoritesDAL } = await import('../../../shared/favorites/infrastructure/cache/FavoritesDAL.js');
                const dal = new FavoritesDAL(uid);
                
                // Step 2: Load local cache and pending queue
                await dal.initialize();
                
                // Step 3: Wire adapter
                const { syncCoordinator } = await import('../../../shared/sync/SyncCoordinator.js');
                syncCoordinator.setFavoritesDAL(dal);
                window.__favoritesDAL = dal; // For legacy fallback if needed
                
                // Step 4: Subscribe to changes and set initial UI state immediately
                dalUnsubscribe = dal.onChange((effectiveFavs) => {
                    setFavorites(effectiveFavs);
                });
                setFavorites(dal.getEffectiveFavorites());
                
                // Step 5: Merge any local guest favorites
                const localFavs = localStorage.getItem('time-tick-favorites');
                if (localFavs) {
                    const parsed = JSON.parse(localFavs);
                    if (parsed.length > 0) {
                        for (const product of parsed) {
                            // Enqueue via DAL to handle offline-safe migration
                            await dal.toggleFavorite(product).catch(() => {});
                        }
                    }
                    localStorage.removeItem('time-tick-favorites');
                }

                // Step 6: Trigger one-time inbound/outbound sync (fire-and-forget)
                syncCoordinator.syncDomain('favorites').catch(err => {
                    console.error('[FavoritesContext] initial sync failed:', err);
                });
                
            } catch (error) {
                console.error("Error initializing favorites:", error);
            } finally {
                setLoading(false);
            }
        };

        const initializeGuestFavorites = async () => {
            const saved = localStorage.getItem('time-tick-favorites');
            if (saved) {
                const parsedFavs = JSON.parse(saved);
                if (parsedFavs.length > 0) {
                    const productIds = parsedFavs.map(p => String(p?.id)).filter(Boolean);
                    try {
                        const latestProducts = await fetchProductsByIds(productIds);
                        
                        if (latestProducts && latestProducts.length > 0) {
                            const hydrated = parsedFavs.map(item => {
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
                            setFavorites(hydrated);
                            return;
                        }
                    } catch (e) {
                        console.error("Hydration error:", e);
                    }
                    setFavorites(parsedFavs);
                } else {
                    setFavorites([]);
                }
            } else {
                setFavorites([]);
            }
        };

        if (currentUser?.uid) {
            initializeAuthFavorites(currentUser.uid);
        } else {
            // Clean up previous user if logging out
            if (window.__favoritesDAL) {
                import('../../../shared/sync/SyncCoordinator.js').then(({ syncCoordinator }) => {
                    syncCoordinator.setFavoritesDAL(null);
                });
                import('../../../shared/sync/SyncMetadata.js').then(({ SyncMetadata }) => {
                    SyncMetadata.clearLastSyncAt('favorites');
                });
                if (window.__favoritesDAL.queue) {
                    window.__favoritesDAL.queue.clearAll().catch(() => {});
                }
                window.__favoritesDAL = null;
            }
            initializeGuestFavorites();
        }

        return () => {
            if (dalUnsubscribe) dalUnsubscribe();
        };
    }, [currentUser]);

    // 2. Persistence Effect (Guests Only)
    useEffect(() => {
        if (!currentUser) {
            localStorage.setItem('time-tick-favorites', JSON.stringify(favorites));
        }
    }, [favorites, currentUser]);

    const toggleFavorite = async (product) => {
        const isFav = favorites.some(fav => String(fav.id) === String(product.id));

        if (currentUser) {
            try {
                if (window.__favoritesDAL) {
                    await window.__favoritesDAL.toggleFavorite(product);
                    // UI state is handled automatically by dal.onChange
                }
            } catch (err) {
                console.error("Failed to enqueue favorite mutation:", err);
                // requireOnline handles Swal popup if offline
            }
        } else {
            const newFavs = isFav 
                ? favorites.filter(fav => String(fav.id) !== String(product.id))
                : [...favorites, product];
            setFavorites(newFavs);
            localStorage.setItem('time-tick-favorites', JSON.stringify(newFavs));
        }
    };

    const isFavorite = (productId) => favorites.some(fav => String(fav.id) === String(productId));

    const refreshFavoriteProduct = useCallback(async (productId) => {
        try {
            const data = await productRepository.getById(String(productId));
            if (!data) return null;

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
            openWishlist,
            loading,
            refreshFavoriteProduct
        }}>
            {children}
        </FavoritesContext.Provider>
    );
};
