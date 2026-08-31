import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc, deleteField } from 'firebase/firestore';
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

const validGenders = ['men', 'women', 'kids'];

async function run() {
    console.log("Starting Gender field migration...");

    try {
        const productsSnap = await getDocs(collection(db, 'products'));
        
        let total = productsSnap.docs.length;
        let migratedCount = 0;
        let skippedCount = 0;
        let invalidCount = 0;
        
        let batch = writeBatch(db);
        let batchCount = 0;
        let totalBatches = 0;

        for (const productDoc of productsSnap.docs) {
            const data = productDoc.data();
            const id = productDoc.id;
            
            const hasLegacyId = 'genderId' in data;
            const hasNewGender = 'gender' in data;
            
            if (hasLegacyId) {
                const legacyVal = data.genderId;
                
                if (validGenders.includes(legacyVal)) {
                    const updates = {
                        gender: legacyVal,
                        genderId: deleteField()
                    };
                    
                    batch.update(productDoc.ref, updates);
                    batchCount++;
                    migratedCount++;
                } else if (!legacyVal || legacyVal.trim() === '') {
                     const updates = {
                        genderId: deleteField()
                    };
                    if (!hasNewGender) {
                         updates.gender = null;
                    }
                    batch.update(productDoc.ref, updates);
                    batchCount++;
                    migratedCount++;
                } else {
                    console.warn(`[WARNING] Product ${id} has unknown genderId: "${legacyVal}". It will NOT be automatically migrated.`);
                    invalidCount++;
                }
            } else {
                skippedCount++;
            }
            
            if (batchCount >= 400) {
                await batch.commit();
                totalBatches++;
                console.log(`Committed batch ${totalBatches}...`);
                batch = writeBatch(db);
                batchCount = 0;
            }
        }
        
        if (batchCount > 0) {
            await batch.commit();
            totalBatches++;
            console.log(`Committed final batch ${totalBatches}...`);
        }
        
        console.log(`\nMigration completed.`);
        console.log(`Total Products: ${total}`);
        console.log(`Migrated: ${migratedCount}`);
        console.log(`Skipped (Already migrated or no genderId): ${skippedCount}`);
        console.log(`Invalid/Unknown (Manual action required): ${invalidCount}`);

        process.exit(0);

    } catch (e) {
        console.error("ERROR during migration:", e);
        process.exit(1);
    }
}

run();
