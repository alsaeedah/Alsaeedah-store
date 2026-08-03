import { cacheSession, clearCachedSession } from './cache';

export const startBackgroundValidation = async (auth, db, appName, onUpdate, onLogout) => {
  try {
    // Wait for the Firebase auth state to resolve initially
    const firebaseUser = await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((u) => {
        unsubscribe();
        resolve(u);
      });
    });

    if (!firebaseUser) {
      console.warn(`[Background Validation] No firebase user found. Forcing logout.`);
      await clearCachedSession();
      if (onLogout) onLogout();
      return;
    }

    // 1. Force ID Token refresh (gets latest custom claims)
    const tokenResult = await firebaseUser.getIdTokenResult(true);
    
    // 2. Fetch Profile/Permissions from Firestore
    const { doc, getDoc } = await import('firebase/firestore');
    const collectionName = appName === 'dashboard' ? 'managers' : 'users';
    
    const docRef = doc(db, collectionName, firebaseUser.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data().is_active === false) {
      console.warn(`[Background Validation] Account missing or disabled in Firestore. Logging out.`);
      await clearCachedSession();
      if (auth.currentUser) await auth.signOut();
      if (onLogout) onLogout();
      return;
    }

    const data = docSnap.data();

    // 3. Construct unified session object
    const sessionData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || data.email,
      name: data.name || firebaseUser.displayName || 'مستخدم', // Dashboard uses 'name' for store compatibility
      image: data.profile_image_url || firebaseUser.photoURL || '',
      role: tokenResult.claims.role || data.role || (appName === 'dashboard' ? 'manager' : 'user'),
      permissions: Object.keys(tokenResult.claims.permissions || {}).length > 0 
                     ? tokenResult.claims.permissions 
                     : (data.permissions || {}),
      // Store-specific extra fields
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
      governorate: data.governorate || '',
      district: data.district || '',
      neighborhood: data.neighborhood || ''
    };

    // 4. Update cache
    await cacheSession(sessionData);

    // 5. Notify UI of fresh data
    if (onUpdate) onUpdate(sessionData);

    console.log(`[Background Validation] Success. Cache & UI updated.`);
  } catch (error) {
    console.error(`[Background Validation] Failed:`, error);
  }
};
