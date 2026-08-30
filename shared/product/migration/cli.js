import { analyzeProducts } from './analyzer.js';
import { createBackup, executeRollback } from './backup.js';
import { executeMigration } from './executor.js';

const command = process.argv[2];

const run = async () => {
    switch (command) {
        case 'analyze':
            console.log('Running Migration Analysis...');
            const report = await analyzeProducts();
            console.log('\n--- ANALYSIS REPORT ---');
            console.log(JSON.stringify(report, null, 2));
            if (report.unmappedCategories.length > 0 || report.unmappedStyles.length > 0) {
                console.error('\nERROR: Cannot proceed with migration. Unresolved mappings exist.');
                process.exit(1);
            }
            break;
            
        case 'backup':
            await createBackup();
            break;
            
        case 'dry-run':
            await executeMigration(true);
            break;
            
        case 'execute':
            console.log('WARNING: You are about to modify the live Firestore database.');
            // Add a small safety delay or prompt if needed
            await executeMigration(false);
            break;
            
        case 'rollback':
            await executeRollback();
            break;
            
        default:
            console.log(`
Taxonomy Migration CLI

Commands:
  analyze   - Scans products and outputs a readiness report
  backup    - Copies original legacy product data to a backup collection
  dry-run   - Simulates the migration logging expected changes without writing
  execute   - Runs the migration in batches (modifies Firestore!)
  rollback  - Restores the database from the backup collection
            `);
            break;
    }
    process.exit(0);
};

run().catch(console.error);
