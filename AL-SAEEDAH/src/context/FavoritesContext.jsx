import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, getDocs, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
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
    
    // 1. Fetch Favorites from Firestore
    const fetchFavorites = useCallback(async (userId) => {
        if (!userId) return;
        setLoading(true);
        
        try {
            if (!window.__favoritesDAL) {
                const { FavoritesDAL } = await import('../../../shared/favorites/infrastructure/cache/FavoritesDAL.js');
                window.__favoritesDAL = new FavoritesDAL(userId);
            }
            await window.__favoritesDAL.initialize();
            // In a fully offline-first app, syncInbound does the fetching.
            // But we can trigger a manual fetch here for legacy compatibility.
            
            const favoritesRef = collection(db, 'favorites');
            const q = query(favoritesRef, where('user_id', '==', userId));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty && querySnapshot.metadata && querySnapshot.metadata.fromCache) {
                // Offline cache miss. Preserving LKG favorites via DAL automatically.
                setLoading(false);
                return;
            }
            
            const favProducts = [];
            querySnapshot.forEach((docSnap) => {
                const item = docSnap.data();
                favProducts.push({
                    ...item.product_data,
                    id: item.product_id,
                    updated_at: item.updated_at
                });
            });
            
            await window.__favoritesDAL.reconcileCache(favProducts);
        } catch (err) {
            console.error("Error fetching favorites:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Real-time listener for product/favorites deletions
    useEffect(() => {
        let unsubscribeFavorites = null;
        let dalUnsubscribe = null;

        if (currentUser?.uid) {
            // Setup DAL
            import('../../../shared/favorites/infrastructure/cache/FavoritesDAL.js').then(({ FavoritesDAL }) => {
                if (!window.__favoritesDAL) {
                    window.__favoritesDAL = new FavoritesDAL(currentUser.uid);
                }
                window.__favoritesDAL.initialize().then(() => {
                    dalUnsubscribe = window.__favoritesDAL.onChange((effectiveFavs) => {
                        // Hydrate UI if needed, but effectiveFavs contains full product_data
                        setFavorites(effectiveFavs);
                    });
                });
            });

            const q = query(collection(db, 'favorites'), where('user_id', '==', currentUser.uid));
            unsubscribeFavorites = onSnapshot(q, (snapshot) => {
                // Inbound changes handled by SyncEngine/Adapter in a fully Offline-First architecture.
                // For now, if we receive a snapshot while online, we pass it to DAL to reconcile
                if (!snapshot.metadata.fromCache && window.__favoritesDAL) {
                    const favProducts = [];
                    snapshot.forEach((docSnap) => {
                        const item = docSnap.data();
                        favProducts.push({
                            ...item.product_data,
                            id: item.product_id,
                            updated_at: item.updated_at
                        });
                    });
                    window.__favoritesDAL.reconcileCache(favProducts);
                }
            });
        }

        return () => {
            if (unsubscribeFavorites) unsubscribeFavorites();
            if (dalUnsubscribe) dalUnsubscribe();
        };
    }, [currentUser]);

    // 2. Merge Local Favorites to Database on Login
    const mergeLocalFavorites = async (userId) => {
        const localFavs = localStorage.getItem('time-tick-favorites');
        if (!localFavs || !userId) return;

        try {
            const parsed = JSON.parse(localFavs);
            if (parsed.length === 0) return;

            for (const product of parsed) {
                const favId = `${userId}_${product.id}`;
                await setDoc(doc(db, 'favorites', favId), {
                    user_id: userId,
                    product_id: String(product.id),
                    product_data: product
                }, { merge: true });
            }
            
            localStorage.removeItem('time-tick-favorites');
            await fetchFavorites(userId);
        } catch (err) {
            console.error("Error merging favorites:", err);
        }
    };

    // 3. Initial Load & Auth Sync
    useEffect(() => {
        if (currentUser) {
            fetchFavorites(currentUser.uid);
            mergeLocalFavorites(currentUser.uid);
        } else {
            const saved = localStorage.getItem('time-tick-favorites');
            if (saved) {
                const parsedFavs = JSON.parse(saved);
                if (parsedFavs.length > 0) {
                    const hydrateGuestFavorites = async () => {
                        const productIds = parsedFavs.map(p => String(p?.id)).filter(Boolean);
                        try {
                            const chunks = [];
                            for (let i = 0; i < productIds.length; i += 10) {
                                chunks.push(productIds.slice(i, i + 10));
                            }
                            
                            let latestProducts = [];
                            for (const chunk of chunks) {
                                const pq = query(collection(db, 'products'), where(documentId(), 'in', chunk));
                                const pSnapshot = await getDocs(pq);
                                pSnapshot.forEach(d => latestProducts.push({ id: d.id, ...d.data() }));
                            }

                            if (latestProducts.length > 0) {
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

        if (currentUser) {
            try {
                // Initialize singleton DAL on first use
                if (!window.__favoritesDAL) {
                    const { FavoritesDAL } = await import('../../../shared/favorites/infrastructure/cache/FavoritesDAL.js');
                    window.__favoritesDAL = new FavoritesDAL(currentUser.uid);
                    await window.__favoritesDAL.initialize();
                }
                
                await window.__favoritesDAL.toggleFavorite(product);
                
                // If successful, update UI
                setFavorites(prev => isFav 
                    ? prev.filter(fav => String(fav.id) !== String(product.id))
                    : [...prev, product]
                );
            } catch (err) {
                console.error("Failed to enqueue favorite mutation:", err);
                if (err.name === 'OfflineError') {
                    // Do nothing or optionally show a toast. SweetAlert is already showing the offline message in requireOnline if we want, or we can just rely on the UI layer. Actually `requireOnline()` handles the Swal popup already.
                }
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
            const docSnap = await getDoc(doc(db, 'products', String(productId)));
            if (!docSnap.exists()) return null;
            const data = docSnap.data();

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
