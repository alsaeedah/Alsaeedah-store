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
        const secret = req.headers['x-init-secret'];
        if (!secret || secret !== process.env.SUPER_ADMIN_INIT_SECRET) {
            return res.status(401).json({ error: 'Unauthorized: Invalid initialization secret' });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        
        // 1. Verify caller token to get their UID
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const targetUid = decodedToken.uid;
        
        // 2. Set super_admin claim for the caller
        await admin.auth().setCustomUserClaims(targetUid, { 
            role: 'super_admin', 
            permissions: { products: true, orders: true, users: true, managers: true }
        });

        // 3. Update Firestore doc to keep UI in sync
        const db = admin.firestore();
        await db.collection('managers').doc(targetUid).set({
            role: 'super_admin',
            permissions: { products: true, orders: true, users: true, managers: true },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return res.status(200).json({ message: 'Super Admin initialized successfully for ' + targetUid });
    } catch (error) {
        console.error('Error initializing super admin:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
