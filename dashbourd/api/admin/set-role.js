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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        
        // 1. Verify caller token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        // 2. Ensure caller is super_admin
        if (decodedToken.role !== 'super_admin') {
            return res.status(403).json({ error: 'Forbidden: Requires super_admin claim' });
        }

        const { targetUid, role, permissions } = req.body;

        if (!targetUid || !role) {
            return res.status(400).json({ error: 'Bad Request: targetUid and role are required' });
        }

        // 3. Set custom claims
        await admin.auth().setCustomUserClaims(targetUid, { role, permissions: permissions || {} });

        // 4. Update Firestore doc to keep UI in sync
        const db = admin.firestore();
        await db.collection('managers').doc(targetUid).set({
            role: role,
            permissions: permissions || {},
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return res.status(200).json({ message: 'Role assigned successfully' });
    } catch (error) {
        console.error('Error setting role:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
