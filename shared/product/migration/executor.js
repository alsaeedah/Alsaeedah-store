import { db } from './config.js';
import { runMappingEngine } from './engine.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_PATH = path.join(__dirname, 'migration_logs.json');
const VERSION = '4.4.0';

const readState = () => {
    if (fs.existsSync(LOG_PATH)) {
        return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
    }
    return {
        version: VERSION,
        startedAt: null,
        completedAt: null,
        status: 'pending',
        processedIds: [], // Used for resume
        failedIds: []
    };
};

const writeState = (state) => {
    fs.writeFileSync(LOG_PATH, JSON.stringify(state, null, 2));
};

export const executeMigration = async (isDryRun = true) => {
    const state = readState();

    if (!isDryRun && state.status === 'completed') {
        console.log(`Migration ${VERSION} is already completed. Skipping.`);
        return;
    }

    if (!isDryRun && state.status === 'pending') {
        state.startedAt = new Date().toISOString();
        state.status = 'in_progress';
        writeState(state);
    }

    console.log(`Loading taxonomy cache for ${isDryRun ? 'DRY RUN' : 'EXECUTION'}...`);
    const categoriesSnap = await db.collection('taxonomy_categories').get();
    const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const brandsSnap = await db.collection('taxonomy_brands').get();
    const brands = brandsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const context = { categories, brands };

    console.log('Loading products...');
    const productsSnap = await db.collection('products').get();
    
    // Filter to only process legacy or mixed products that haven't been processed yet
    const toProcess = productsSnap.docs.filter(doc => {
        if (!isDryRun && state.processedIds.includes(doc.id)) return false;
        const data = doc.data();
        // Only process if it has legacy fields and lacks taxonomy IDs
        return (data.category || data.style) && (!data.categoryId || !data.brandId);
    });

    console.log(`Found ${toProcess.length} products to migrate.`);

    let batchCount = 0;
    let successCount = 0;
    let failCount = 0;
    let batch = db.batch();
    let batchOperations = 0;

    for (const doc of toProcess) {
        const data = doc.data();
        const mapped = runMappingEngine(data, context);
        
        let isReady = false;
        
        if ((data.category && data.category !== 'all' && !mapped.categoryId) || 
            (data.style && data.style !== 'all' && !mapped.brandId)) {
            console.log(`[FAILED] Product ID: ${doc.id} | category: "${data.category}" | style: "${data.style}" -> UNMAPPED`);
            if (!isDryRun) {
                state.failedIds.push(doc.id);
                failCount++;
            }
        } else {
            console.log(`[READY] Product ID: ${doc.id} | Before: { category:"${data.category}", style:"${data.style}" } | After: { categoryId:"${mapped.categoryId}", brandId:"${mapped.brandId}" }`);
            isReady = true;
        }

        if (!isDryRun && isReady) {
            // Merge mapped IDs with existing data
            const updateData = {
                categoryId: mapped.categoryId || null,
                brandId: mapped.brandId || null,
                collectionId: mapped.collectionId || null,
                genderId: mapped.genderId || null
            };

            batch.update(doc.ref, updateData);
            state.processedIds.push(doc.id);
            successCount++;
            batchOperations++;

            if (batchOperations >= 400) {
                try {
                    await batch.commit();
                    batchCount++;
                    console.log(`Committed batch ${batchCount}. Processed ${successCount} products.`);
                    writeState(state);
                } catch (e) {
                    console.error('Batch commit failed!', e);
                    // Failure isolation: log and continue (though in a real scenario we'd track per-doc)
                }
                batch = db.batch();
                batchOperations = 0;
            }
        }
    }

    if (!isDryRun && batchOperations > 0) {
        try {
            await batch.commit();
            batchCount++;
            console.log(`Committed final batch ${batchCount}. Processed ${successCount} products.`);
            writeState(state);
        } catch (e) {
            console.error('Final batch commit failed!', e);
        }
    }

    if (isDryRun) {
        console.log('--- DRY RUN COMPLETE ---');
        console.log('No database modifications were made.');
    } else {
        console.log('--- EXECUTION COMPLETE ---');
        state.completedAt = new Date().toISOString();
        state.status = 'completed';
        writeState(state);
        console.log(`Successfully migrated ${successCount} products. Failed: ${failCount}.`);
    }
};
