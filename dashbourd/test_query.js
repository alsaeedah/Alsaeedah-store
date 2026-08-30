import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, getDocs, limit, documentId } from 'firebase/firestore';

dotenv.config({ path: '.env' });

const app = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN
});

const db = getFirestore(app);

async function run() {
    try {
        console.log("Testing query 1: orderBy('created_at', 'desc'), orderBy(documentId(), 'desc')");
        const q1 = query(collection(db, 'products'), orderBy('created_at', 'desc'), orderBy(documentId(), 'desc'), limit(10001));
        const snap1 = await getDocs(q1);
        console.log("Success! Docs fetched:", snap1.docs.length);
    } catch(e) {
        console.error("ERROR in query 1:", e);
    }
}

run();
