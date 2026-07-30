import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateTable(tableName, idField = 'id', transform = null) {
    console.log(`Migrating ${tableName}...`);
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
        console.error(`Error reading ${tableName}:`, error);
        return;
    }
    
    console.log(`Found ${data.length} records in ${tableName}`);
    
    // Firestore batch writes max 500 operations
    const BATCH_SIZE = 400;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = data.slice(i, i + BATCH_SIZE);
        
        chunk.forEach(item => {
            const docId = String(item[idField]);
            const finalItem = transform ? transform(item) : item;
            
            // Clean undefined/null to avoid Firestore errors
            Object.keys(finalItem).forEach(key => {
                if (finalItem[key] === undefined) {
                    delete finalItem[key];
                }
            });
            
            const docRef = doc(db, tableName, docId);
            batch.set(docRef, finalItem, { merge: true });
        });
        
        await batch.commit();
        console.log(`Batch committed for ${tableName} (${i + chunk.length}/${data.length})`);
    }
    console.log(`Finished migrating ${tableName}`);
}

async function migrateAll() {
    try {
        await migrateTable('products', 'id');
        await migrateTable('hero', 'id');
        await migrateTable('users', 'id');
        await migrateTable('orders', 'id');
        await migrateTable('settings', 'id');
        await migrateTable('favorites', 'id');
        
        // Setup counter for orders to preserve auto-increment logic
        console.log('Setting up order counter...');
        const { data: lastOrder } = await supabase.from('orders').select('order_number').order('order_number', { ascending: false }).limit(1);
        const currentOrderNumber = (lastOrder && lastOrder.length > 0) ? lastOrder[0].order_number : 1000;
        await setDoc(doc(db, 'counters', 'orders'), { current: currentOrderNumber }, { merge: true });
        console.log(`Order counter set to ${currentOrderNumber}`);
        
        console.log('Migration Completed Successfully!');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrateAll().then(() => process.exit(0));
