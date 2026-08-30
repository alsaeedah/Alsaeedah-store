import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

dotenv.config({ path: '.env' });

const app = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN
});

const db = getFirestore(app);

async function run() {
    try {
        console.log("Fetching Categories:");
        const categoriesSnap = await getDocs(collection(db, 'categories'));
        categoriesSnap.docs.forEach(doc => {
            console.log(`- ID: ${doc.id}, Name: ${doc.data().name}`);
        });

        console.log("\nFetching Brands:");
        const brandsSnap = await getDocs(collection(db, 'brands'));
        brandsSnap.docs.forEach(doc => {
            const data = doc.data();
            console.log(`- ID: ${doc.id}, Name: ${data.name}, CategoryIds: ${data.categoryIds?.join(', ') || 'N/A'}`);
        });

    } catch(e) {
        console.error("ERROR:", e);
    }
}

run();
