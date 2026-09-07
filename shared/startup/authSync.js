import { cacheSession, clearCachedSession } from './cache';

/**
 * Global authentication generation counter.
 * Guarantees that stale asynchronous operations (like slow Firestore reads from
 * a previous login) are aborted and cannot overwrite a newer session.
 */
let currentAuthGeneration = 0;

/**
 * Module-level single-flight Promise for Background Validation.
 */
let validationPromise = null;

/**
 * Helper: Force-refresh the ID token if claims are missing.
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
 * Core validation logic.
 */
const _doValidation = async (firebaseUser, db, appName, onUpdate, onLogout, generation, onError) => {
  if (!firebaseUser) {
    console.warn('[Background Validation] No firebase user provided. Forcing logout.');
    if (generation === currentAuthGeneration) {
        await clearCachedSession();
        if (onLogout) onLogout();
    }
    return;
  }

  try {
    // 1. Get Token Claims
    const claims = await getValidClaims(firebaseUser);

    // 2. Check local session
    const { getCachedSession } = await import('./cache');
    const localSession = await getCachedSession();

    let sessionData;

    // For Store app, if we have a matching local session skip the Firestore read.
    if (appName !== 'dashboard' && localSession && localSession.data && localSession.data.uid === firebaseUser.uid) {
      console.log('[Background Validation] Using local session data to save Firestore read.');
      const finalRole = claims.role || localSession.data.role || 'manager';
      sessionData = {
        ...localSession.data,
        role: finalRole,
        permissions: localSession.data.permissions || {}
      };
    } else {
      // 3. Fetch Profile from Firestore
      const { doc, getDoc } = await import('firebase/firestore');
      const collectionName = appName === 'dashboard' ? 'managers' : 'users';

      const docRef = doc(db, collectionName, firebaseUser.uid);
      
      let docSnap;
      try {
          docSnap = await getDoc(docRef);
      } catch (firestoreError) {
          console.error('[DIAGNOSTIC] Firestore read failed during authSync:', {
              operation: 'getDoc',
              collection: collectionName,
              errorCode: firestoreError.code
          });
          throw firestoreError;
      }

      if (docSnap.exists() && docSnap.data().is_active === false) {
        console.warn('[Background Validation] Account disabled in Firestore. Logging out.');
        if (generation === currentAuthGeneration) {
            await clearCachedSession();
            if (onLogout) onLogout();
        }
        return;
      }

      const data = docSnap.exists() ? docSnap.data() : {};
      
      if (!docSnap.exists() && appName === 'dashboard') {
          console.warn('[Background Validation] Dashboard manager document missing. Logging out.');
          if (generation === currentAuthGeneration) {
              await clearCachedSession();
              if (onLogout) onLogout();
          }
          return;
      }

      // 4. Construct unified session object
      const isSuperAdminClaim = claims && claims.role === 'super_admin';

      const finalRole = appName === 'dashboard'
          ? (isSuperAdminClaim ? 'super_admin' : (data.role || 'manager'))
          : (claims.role || data.role || 'user');

      const tokenPermissions = Array.isArray(claims.permissions) ? claims.permissions : [];
      const dataPermissions = appName === 'dashboard'
          ? (data.permissions || {})
          : (Array.isArray(data.permissions) ? data.permissions : []);

      // CRITICAL SECURITY FIX: Do not merge cached permissions for dashboard.
      // Dashboard must resolve solely from authoritative Firestore/Claims data.
      const finalPermissions = appName === 'dashboard'
          ? dataPermissions
          : (tokenPermissions.length > 0 ? tokenPermissions : dataPermissions);

      sessionData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || data.email,
        name: data.name || firebaseUser.displayName || 'مستخدم',
        image: data.profile_image_url || firebaseUser.photoURL || '',
        role: finalRole,
        permissions: finalPermissions,
        // Store-specific extra fields
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        governorate: data.governorate || '',
        district: data.district || '',
        neighborhood: data.neighborhood || ''
      };
    }

    // 5. Verification: Check generation before committing state
    if (generation !== currentAuthGeneration) {
        console.warn(`[Background Validation] Generation mismatch (${generation} !== ${currentAuthGeneration}). Aborting state commit.`);
        return;
    }

    // 6. Update cache
    await cacheSession(sessionData);

    // 7. Notify UI of fresh data
    if (onUpdate) onUpdate(sessionData);

    console.log('[Background Validation] Success. Cache & UI updated.');
  } catch (error) {
    console.error('[Background Validation] Failed:', error.message, error.stack);
    if (generation === currentAuthGeneration) {
        if (onError) onError(error);
    }
  }
};

/**
 * startBackgroundValidation — Single-flight Background Validation with Generation Tracking.
 */
export const startBackgroundValidation = async (firebaseUser, db, appName, onUpdate, onLogout, onError) => {
  currentAuthGeneration++;
  const generation = currentAuthGeneration;

  if (validationPromise) {
    console.log('[AUTH] Waiting for previous validation to clear...');
    try { await validationPromise; } catch (e) {}
  }

  if (generation !== currentAuthGeneration) {
      console.log(`[AUTH] Generation changed while waiting (${generation} !== ${currentAuthGeneration}), aborting.`);
      return;
  }

  console.log(`[AUTH] VALIDATION_START - Generation ${generation}`);
  
  validationPromise = _doValidation(firebaseUser, db, appName, onUpdate, onLogout, generation, onError)
    .finally(() => {
      if (currentAuthGeneration === generation) {
          validationPromise = null;
      }
    });

  return validationPromise;
};
