import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runMigration() {
    console.log("Starting migration: copying gender -> genderId");
    try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const batches = [];
        let currentBatch = writeBatch(db);
        let opCount = 0;
        let migratedCount = 0;

        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            
            if (data.gender !== undefined) {
                currentBatch.update(doc.ref, {
                    genderId: data.gender
                });
                migratedCount++;
                opCount++;
            }

            if (opCount === 500) {
                batches.push(currentBatch);
                currentBatch = writeBatch(db);
                opCount = 0;
            }
        }

        if (opCount > 0) {
            batches.push(currentBatch);
        }

        console.log(`Prepared ${batches.length} batches to migrate ${migratedCount} products.`);
        for (let i = 0; i < batches.length; i++) {
            await batches[i].commit();
            console.log(`Batch ${i + 1}/${batches.length} committed.`);
        }

        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    }
    process.exit(0);
}

runMigration();
