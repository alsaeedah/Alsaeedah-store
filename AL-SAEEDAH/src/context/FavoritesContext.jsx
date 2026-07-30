import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, getDocs, setDoc, deleteDoc, getDoc, query, where, documentId } from 'firebase/firestore';

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
            const favoritesRef = collection(db, 'favorites');
            const q = query(favoritesRef, where('user_id', '==', userId));
            const querySnapshot = await getDocs(q);
            
            const favProducts = [];
            querySnapshot.forEach((docSnap) => {
                const item = docSnap.data();
                favProducts.push({
                    ...item.product_data,
                    id: item.product_id
                });
            });
            
            if (favProducts.length > 0) {
                const productIds = favProducts.map(p => String(p.id));
                const productsRef = collection(db, 'products');
                
                // Chunk queries for 'in' (max 10)
                const chunks = [];
                for (let i = 0; i < productIds.length; i += 10) {
                    chunks.push(productIds.slice(i, i + 10));
                }

                let latestProducts = [];
                for (const chunk of chunks) {
                    const pq = query(productsRef, where(documentId(), 'in', chunk));
                    const pSnapshot = await getDocs(pq);
                    pSnapshot.forEach(d => latestProducts.push({ id: d.id, ...d.data() }));
                }
                    
                if (latestProducts.length > 0) {
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
        let unsubscribeProducts = null;
        let unsubscribeFavorites = null;

        // Listener 1: Watch products table
        unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'removed') {
                    setFavorites(prev => prev.filter(item => String(item.id) !== String(change.doc.id)));
                } else if (change.type === 'modified') {
                    const updatedProduct = change.doc.data();
                    const updatedId = change.doc.id;
                    setFavorites(prev => prev.map(item => {
                        if (String(item.id) === String(updatedId)) {
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
            });
        });

        // Listener 2 & 3: Watch favorites table for current user
        if (currentUser?.uid) {
            const q = query(collection(db, 'favorites'), where('user_id', '==', currentUser.uid));
            unsubscribeFavorites = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'removed') {
                        const deletedProductId = change.doc.data().product_id;
                        setFavorites(prev => prev.filter(item => String(item.id) !== String(deletedProductId)));
                    } else if (change.type === 'added') {
                        const newFav = change.doc.data();
                        const formattedProduct = {
                            ...newFav.product_data,
                            id: newFav.product_id
                        };
                        setFavorites(prev => {
                            const exists = prev.some(item => String(item.id) === String(formattedProduct.id));
                            if (exists) return prev;
                            return [...prev, formattedProduct];
                        });
                    }
                });
            });
        }

        return () => {
            if (unsubscribeProducts) unsubscribeProducts();
            if (unsubscribeFavorites) unsubscribeFavorites();
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
        const previousFavs = [...favorites];
        const newFavs = isFav 
            ? favorites.filter(fav => String(fav.id) !== String(product.id))
            : [...favorites, product];

        setFavorites(newFavs);

        if (currentUser) {
            try {
                const favId = `${currentUser.uid}_${product.id}`;
                if (isFav) {
                    await deleteDoc(doc(db, 'favorites', favId));
                } else {
                    await setDoc(doc(db, 'favorites', favId), {
                        user_id: currentUser.uid,
                        product_id: String(product.id),
                        product_data: product
                    });
                }
            } catch (err) {
                console.error("Failed to sync favorites with database:", err);
                setFavorites(previousFavs);
                alert("حدث خطأ أثناء مزامنة المفضلة. تم التراجع عن التغيير.");
            }
        } else {
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
