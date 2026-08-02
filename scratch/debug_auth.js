import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

async function main() {
    console.log("Reading service account...");
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    if (!serviceAccount.project_id) {
        console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in env");
        process.exit(1);
    }
    initializeApp({ credential: cert(serviceAccount) });
    const auth = getAuth();
    const db = getFirestore();

    console.log("\n--- Users in Firebase Auth ---");
    const { users } = await auth.listUsers();
    for (const u of users) {
        console.log(`- Email: ${u.email} | UID: ${u.uid} | Claims: ${JSON.stringify(u.customClaims)}`);
    }

    console.log("\n--- Managers in Firestore ---");
    const snapshot = await db.collection('managers').get();
    snapshot.forEach(doc => {
        console.log(`- UID: ${doc.id} | Email: ${doc.data().email} | Role: ${doc.data().role}`);
    });

    console.log("\n--- System Config ---");
    const configDoc = await db.collection('system').doc('config').get();
    console.log(`Config: ${JSON.stringify(configDoc.data())}`);
}

main().catch(console.error);
