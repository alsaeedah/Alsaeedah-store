import { db } from './config.js';

const MIGRATION_VERSION = '4.4.0';

export const createBackup = async () => {
    console.log('Starting full product backup...');
    
    const productsSnap = await db.collection('products').get();
    let count = 0;

    // Use batching for backups
    let batch = db.batch();
    let operations = 0;

    for (const doc of productsSnap.docs) {
        const backupRef = db.collection('product_migration_backup').doc(doc.id);
        
        batch.set(backupRef, {
            productId: doc.id,
            originalData: doc.data(),
            migrationVersion: MIGRATION_VERSION,
            createdAt: new Date().toISOString()
        });
        
        operations++;
        count++;

        if (operations >= 400) {
            await batch.commit();
            console.log(`Backed up ${count} products...`);
            batch = db.batch();
            operations = 0;
        }
    }

    if (operations > 0) {
        await batch.commit();
        console.log(`Backed up ${count} products...`);
    }

    console.log(`Backup complete. Total backed up: ${count}`);
    return count;
};

export const executeRollback = async () => {
    console.log(`Starting rollback using backup data (Version: ${MIGRATION_VERSION})...`);
    
    const backupSnap = await db.collection('product_migration_backup')
        .where('migrationVersion', '==', MIGRATION_VERSION)
        .get();

    if (backupSnap.empty) {
        console.log('No backup found for the current migration version.');
        return 0;
    }

    let count = 0;
    let batch = db.batch();
    let operations = 0;

    for (const doc of backupSnap.docs) {
        const backupData = doc.data();
        const productRef = db.collection('products').doc(backupData.productId);
        
        batch.set(productRef, backupData.originalData);
        
        operations++;
        count++;

        if (operations >= 400) {
            await batch.commit();
            console.log(`Restored ${count} products...`);
            batch = db.batch();
            operations = 0;
        }
    }

    if (operations > 0) {
        await batch.commit();
        console.log(`Restored ${count} products...`);
    }

    console.log(`Rollback complete. Total restored: ${count}`);
    return count;
};
