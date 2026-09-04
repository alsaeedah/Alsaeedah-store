import { cacheSession, clearCachedSession } from './cache';

/**
 * Module-level single-flight Promise for Background Validation.
 * 
 * Guarantees that concurrent callers (e.g., post-login + lifecycle resume)
 * share a single in-flight validation rather than starting independent ones.
 * Cleared in a `finally` block so future validations (next resume, next login)
 * can execute a fresh check after the previous one completes or fails.
 */
let validationPromise = null;

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

/**
 * Core validation logic — runs once per single-flight window.
 * 
 * Accepts the already-resolved firebaseUser directly to avoid spawning
 * a nested onAuthStateChanged listener inside the validation function.
 * 
 * @param {object} firebaseUser - The Firebase Auth user object (already resolved by caller).
 * @param {object} db - Firestore DB instance.
 * @param {string} appName - 'store' or 'dashboard'.
 * @param {Function} onUpdate - Called with enriched session on success.
 * @param {Function} onLogout - Called when the user should be logged out.
 */
const _doValidation = async (firebaseUser, db, appName, onUpdate, onLogout) => {
  if (!firebaseUser) {
    console.warn('[Background Validation] No firebase user provided. Forcing logout.');
    await clearCachedSession();
    if (onLogout) onLogout();
    return;
  }

  try {
    // 1. Get Token Claims (force refresh if needed)
    const claims = await getValidClaims(firebaseUser);

    // 2. Authorize Dashboard Users immediately (Claims-First)
    if (appName === 'dashboard') {
      if (!claims.role || (claims.role !== 'super_admin' && claims.role !== 'manager')) {
        console.warn('[Background Validation] Dashboard unauthorized (Missing or invalid claims). Forcing logout.');
        await clearCachedSession();
        if (firebaseUser.auth?.currentUser) await firebaseUser.auth.signOut();
        if (onLogout) onLogout();
        return;
      }
    }

    // 3. Check local session
    const { getCachedSession } = await import('./cache');
    const localSession = await getCachedSession();

    let sessionData;

    // For Store app, if we have a matching local session skip the Firestore read.
    // ProfileSyncStrategy will handle background profile updates.
    if (appName !== 'dashboard' && localSession && localSession.uid === firebaseUser.uid) {
      console.log('[Background Validation] Using local session data to save Firestore read.');
      const cachedPermissions = Array.isArray(localSession.permissions) ? localSession.permissions : [];
      const tokenPermissions = Array.isArray(claims.permissions) ? claims.permissions : [];

      sessionData = {
        ...localSession,
        role: claims.role || localSession.role,
        permissions: tokenPermissions.length > 0 ? tokenPermissions : cachedPermissions
      };
    } else {
      // 4. Fetch Profile from Firestore
      const { doc, getDoc } = await import('firebase/firestore');
      const collectionName = appName === 'dashboard' ? 'managers' : 'users';

      const docRef = doc(db, collectionName, firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists() || docSnap.data().is_active === false) {
        console.warn('[Background Validation] Account missing or disabled in Firestore. Logging out.');
        await clearCachedSession();
        if (onLogout) onLogout();
        return;
      }

      const data = docSnap.data();

      // 5. Construct unified session object
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

    // 6. Update cache
    await cacheSession(sessionData);

    // 7. Notify UI of fresh data
    if (onUpdate) onUpdate(sessionData);

    console.log('[Background Validation] Success. Cache & UI updated.');
  } catch (error) {
    console.error('[Background Validation] Failed:', error.message, error.stack);
    // Do not logout on transient errors (network issues, etc.)
    // The existing session remains valid until explicitly invalidated.
  }
};

/**
 * startBackgroundValidation — Single-flight Background Validation.
 * 
 * If a validation is already in progress, returns the same Promise so
 * concurrent callers (e.g., login + lifecycle resume) share one execution.
 * 
 * The Promise is cleared in a `finally` block (success or failure) so
 * future calls (next resume, next login cycle) start a fresh validation.
 * 
 * @param {object} firebaseUser - The resolved Firebase Auth user object from the caller's onAuthStateChanged.
 * @param {object} db - Firestore DB instance.
 * @param {string} appName - 'store' or 'dashboard'.
 * @param {Function} onUpdate - Called with enriched session on success.
 * @param {Function} onLogout - Called when the user must be logged out.
 * @returns {Promise<void>}
 */
export const startBackgroundValidation = (firebaseUser, db, appName, onUpdate, onLogout) => {
  if (validationPromise) {
    console.log('[Background Validation] Already running — reusing existing promise.');
    return validationPromise;
  }

  console.log('[Background Validation] Starting...');
  validationPromise = _doValidation(firebaseUser, db, appName, onUpdate, onLogout)
    .finally(() => {
      validationPromise = null;
    });

  return validationPromise;
};
