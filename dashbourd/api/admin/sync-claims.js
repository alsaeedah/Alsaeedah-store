import admin from 'firebase-admin';

if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY', e);
        }
    } else {
        console.warn('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }
}

/**
 * POST /api/admin/sync-claims
 *
 * Syncs the authenticated user's role and permissions from the Firestore
 * `managers` collection into their Firebase Auth custom claims.
 *
 * Authorization: The caller must provide a valid Firebase ID token via the
 * Authorization header. The Admin SDK verifies the token AND cross-checks
 * the `managers` Firestore document, so no client-side secret is required.
 *
 * This endpoint is safe to call from the frontend without exposing secrets.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Guard: Admin SDK must be initialized
    if (!admin.apps.length) {
        console.error('[sync-claims] Firebase Admin SDK is not initialized.');
        return res.status(503).json({ error: 'Service Unavailable: Server-side Firebase not configured.' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const idToken = authHeader.split('Bearer ')[1];

        // 1. Verify the caller's ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Look up the managers document in Firestore (server-side, authoritative)
        const db = admin.firestore();
        const managerDoc = await db.collection('managers').doc(uid).get();

        if (!managerDoc.exists) {
            return res.status(403).json({ error: 'Forbidden: No manager record found for this account.' });
        }

        const data = managerDoc.data();

        if (!data.is_active) {
            return res.status(403).json({ error: 'Forbidden: This account is disabled.' });
        }

        const role = data.role || 'manager';
        const permissions = data.permissions || {};

        // 3. Set custom claims to match the Firestore document
        await admin.auth().setCustomUserClaims(uid, { role, permissions });

        console.log(`[sync-claims] Claims synced for UID ${uid}: role=${role}`);

        return res.status(200).json({
            message: 'Claims synced successfully.',
            role,
            permissions
        });
    } catch (error) {
        console.error('[sync-claims] Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
