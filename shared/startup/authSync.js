import { cacheSession, clearCachedSession } from './cache';

/**
 * Helper: Force-refresh the ID token if claims are missing.
 * Replaces the old aggressive retry loop with a single refresh check.
 */
const getValidClaims = async (firebaseUser) => {
  let tokenResult = await firebaseUser.getIdTokenResult();
  
  if (!tokenResult.claims.role) {
    console.log('[AuthSync] Role claim missing. Forcing token refresh...');
    tokenResult = await firebaseUser.getIdTokenResult(true);
  }
  
  return tokenResult.claims;
};

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

    // 1. Get Token Claims (force refresh if needed)
    const claims = await getValidClaims(firebaseUser);
    
    // 2. Authorize Dashboard Users immediately (Claims-First)
    if (appName === 'dashboard') {
      if (!claims.role || (claims.role !== 'super_admin' && claims.role !== 'manager')) {
        console.warn(`[Background Validation] Dashboard unauthorized (Missing or invalid claims). Forcing logout.`);
        await clearCachedSession();
        if (auth.currentUser) await auth.signOut();
        if (onLogout) onLogout();
        return;
      }
    }

    // Check local session
    const { getCachedSession } = await import('./cache');
    const localSession = await getCachedSession();
    
    let sessionData;

    // For Store app, if we have local session, skip getDoc to save a read!
    // ProfileSyncStrategy will handle background updates.
    if (appName !== 'dashboard' && localSession && localSession.uid === firebaseUser.uid) {
        console.log(`[Background Validation] Using local session data to save Firestore read.`);
        const cachedPermissions = Array.isArray(localSession.permissions) ? localSession.permissions : [];
        const tokenPermissions = Array.isArray(claims.permissions) ? claims.permissions : [];
        
        sessionData = {
            ...localSession,
            role: claims.role || localSession.role,
            permissions: tokenPermissions.length > 0 ? tokenPermissions : cachedPermissions
        };
    } else {
        // 3. Fetch Profile from Firestore (after authorization for Dashboard)
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

        // 4. Construct unified session object
        const tokenPermissions = Array.isArray(claims.permissions) ? claims.permissions : [];
        const dataPermissions = Array.isArray(data.permissions) ? data.permissions : [];

        sessionData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email,
          name: data.name || firebaseUser.displayName || 'مستخدم',
          image: data.profile_image_url || firebaseUser.photoURL || '',
          role: claims.role || data.role || (appName === 'dashboard' ? 'manager' : 'user'),
          permissions: tokenPermissions.length > 0 ? tokenPermissions : dataPermissions,
          // Store-specific extra fields
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          governorate: data.governorate || '',
          district: data.district || '',
          neighborhood: data.neighborhood || ''
        };
    }

    // 5. Update cache
    await cacheSession(sessionData);

    // 6. Notify UI of fresh data
    if (onUpdate) onUpdate(sessionData);

    console.log(`[Background Validation] Success. Cache & UI updated.`);
  } catch (error) {
    console.error(`[Background Validation] Failed:`, error);
  }
};
