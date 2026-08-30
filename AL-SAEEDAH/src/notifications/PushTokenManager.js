/**
 * Push Token Manager
 * 
 * Manages push notification tokens in a Local-First, offline-resilient manner.
 * - Caches token locally.
 * - Syncs to Firestore `user_push_tokens` independently of Product SyncEngine.
 * - Fails silently if offline or network errors occur, retrying on next attempt.
 */

import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { get, set, remove } from './NotificationStorage';
import * as Logger from './NotificationLogger';

const TOKEN_CACHE_KEY = 'agy_push_token_cache';
const TOKEN_SYNC_PENDING_KEY = 'agy_push_token_sync_pending';

/**
 * Save a push token locally and attempt to sync to Firestore.
 * If offline, it marks as pending and will sync later.
 * 
 * @param {string} userId - The current user's ID
 * @param {string} token - The FCM or APNs token
 * @param {string} platform - 'web', 'android', or 'ios'
 */
export async function saveToken(userId, token, platform) {
  if (!userId || !token) return;

  try {
    // 1. Save locally (Offline-First)
    const tokenData = {
      userId,
      token,
      platform,
      updatedAt: new Date().toISOString(),
      active: true,
    };
    
    await set(TOKEN_CACHE_KEY, tokenData);
    await set(TOKEN_SYNC_PENDING_KEY, true);

    // 2. Attempt Firestore Sync
    await _syncTokenToFirestore(userId, tokenData);
  } catch (err) {
    // Fail silently (offline or network error)
    // The pending flag ensures it will be retried later.
    Logger.error('PushTokenManager.saveToken', err);
  }
}

/**
 * Remove a token (e.g., on logout).
 * Attempts to delete from Firestore, then clears local cache.
 * 
 * @param {string} userId - The current user's ID
 * @param {string} token - The specific token to remove (optional)
 */
export async function removeToken(userId, token = null) {
  if (!userId) return;

  try {
    const cachedTokenData = await get(TOKEN_CACHE_KEY);
    const tokenToRemove = token || (cachedTokenData ? cachedTokenData.token : null);

    if (tokenToRemove) {
      // 1. Attempt Firestore delete
      try {
        const { ConnectivityService } = await import('@shared/connectivity/ConnectivityService');
        await ConnectivityService.getInstance().requireOnline();

        const tokenDocRef = doc(db, 'user_push_tokens', tokenToRemove);
        // We set active to false or delete. Let's delete to keep it clean.
        await deleteDoc(tokenDocRef);
      } catch (err) {
        Logger.error('PushTokenManager.removeToken Firestore', err);
        // If this fails (e.g., offline), we still want to clear local cache so the user is logged out locally.
      }
    }

    // 2. Clear local cache
    await remove(TOKEN_CACHE_KEY);
    await remove(TOKEN_SYNC_PENDING_KEY);

  } catch (err) {
    Logger.error('PushTokenManager.removeToken', err);
  }
}

/**
 * Retry syncing the token to Firestore if it was pending.
 * Safe to call on app startup or network reconnect.
 */
export async function retryPendingSync() {
  try {
    const isPending = await get(TOKEN_SYNC_PENDING_KEY);
    if (!isPending) return;

    const tokenData = await get(TOKEN_CACHE_KEY);
    if (tokenData && tokenData.userId && tokenData.token) {
      await _syncTokenToFirestore(tokenData.userId, tokenData);
    } else {
      // Invalid state, clear pending
      await remove(TOKEN_SYNC_PENDING_KEY);
    }
  } catch (err) {
    Logger.error('PushTokenManager.retryPendingSync', err);
  }
}

/**
 * Internal helper to sync to Firestore.
 */
async function _syncTokenToFirestore(userId, tokenData) {
  try {
    const { ConnectivityService } = await import('@shared/connectivity/ConnectivityService');
    await ConnectivityService.getInstance().requireOnline();

    const tokenDocRef = doc(db, 'user_push_tokens', tokenData.token);
    await setDoc(tokenDocRef, tokenData, { merge: true });
    
    // Sync successful, clear pending flag
    await set(TOKEN_SYNC_PENDING_KEY, false);
    Logger.log('PUSH_TOKEN_SYNCED', 'Token synced to Firestore successfully.');
  } catch (err) {
    Logger.error('PushTokenManager._syncTokenToFirestore', err);
    throw err; // Let calling function handle it
  }
}
