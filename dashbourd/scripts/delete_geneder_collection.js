import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN
});

const db = getFirestore(app);

async function run() {
    console.log("Deleting 'geneder' collection...");

    try {
        const colRef = collection(db, 'geneder');
        const snap = await getDocs(colRef);
        
        let total = snap.docs.length;
        console.log(`Found ${total} documents in 'geneder' collection.`);
        
        if (total === 0) {
             console.log("Collection is already empty or does not exist.");
             process.exit(0);
        }

        let batch = writeBatch(db);
        let batchCount = 0;

        for (const d of snap.docs) {
            batch.delete(d.ref);
            batchCount++;
            
            if (batchCount >= 400) {
                await batch.commit();
                batch = writeBatch(db);
                batchCount = 0;
            }
        }
        
        if (batchCount > 0) {
            await batch.commit();
        }
        
        console.log(`Successfully deleted ${total} documents. Collection 'geneder' is now removed.`);
        process.exit(0);
    } catch (e) {
        console.error("ERROR deleting collection:", e);
        process.exit(1);
    }
}

run();
