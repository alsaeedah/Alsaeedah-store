/**
 * migrate_manager_roles.js
 *
 * One-time migration: adds role: "manager" to existing manager Firestore
 * documents that are missing the role field.
 *
 * Uses the Firebase Admin SDK — bypasses Firestore Security Rules.
 * The managers collection requires isSuperAdmin() for writes; a client-side
 * Web SDK script cannot satisfy that rule. Admin SDK is required.
 *
 * SAFETY GUARANTEES:
 *   - Documents with role === "super_admin" are NEVER touched
 *   - Only writes: { role: "manager" } — nothing else is modified
 *   - Dry-run mode by default — no writes without explicit DRY_RUN=false
 *   - Idempotent — running multiple times is safe (already-correct docs skipped)
 *   - Batched writes (≤ 400 per batch, well within Firestore 500-op limit)
 *   - Complete audit log to stdout
 *   - Fatal errors cause non-zero process exit
 *
 * REQUIRED ENV VAR:
 *   FIREBASE_SERVICE_ACCOUNT_KEY — JSON string of the Firebase service account
 *                                   credentials. Add to .env (already gitignored).
 *                                   Obtain from Firebase Console →
 *                                   Project Settings → Service accounts →
 *                                   Generate new private key.
 *
 * USAGE:
 *   # Step 1 — dry run (inspect what would change, no writes)
 *   node scripts/migrate_manager_roles.js
 *
 *   # Step 2 — review the output carefully, confirm Super Admin is skipped
 *
 *   # Step 3 — apply changes
 *   DRY_RUN=false node scripts/migrate_manager_roles.js
 *
 * DO NOT put the service account JSON into source code.
 * DO NOT commit FIREBASE_SERVICE_ACCOUNT_KEY to version control.
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Setup ────────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const DRY_RUN = process.env.DRY_RUN !== 'false';

// ── Admin SDK Initialization ─────────────────────────────────────────────────

if (!admin.apps.length) {
    const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!keyJson) {
        console.error(
            '\n[Migration] ERROR: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.\n' +
            'Add it to your .env file:\n' +
            '  FIREBASE_SERVICE_ACCOUNT_KEY=\'{"type":"service_account",...}\'\n' +
            'Obtain from: Firebase Console → Project Settings → Service accounts → Generate new private key\n'
        );
        process.exit(1);
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(keyJson);
    } catch (parseErr) {
        console.error('[Migration] ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', parseErr.message);
        process.exit(1);
    }

    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

// ── Migration ────────────────────────────────────────────────────────────────

async function run() {
    console.log('\n════════════════════════════════════════════════════════');
    console.log('  migrate_manager_roles.js — Add role:"manager" to managers');
    console.log('════════════════════════════════════════════════════════');
    console.log(`  Mode:     ${DRY_RUN ? '🔍 DRY-RUN (no writes)' : '✅ WRITE (changes will be committed)'}`);
    console.log('────────────────────────────────────────────────────────\n');

    let snap;
    try {
        snap = await db.collection('managers').get();
    } catch (err) {
        console.error('[Migration] ERROR: Failed to read managers collection:', err.message);
        process.exit(1);
    }

    console.log(`  Found ${snap.size} document(s) in managers collection.\n`);

    let countSuperAdmin  = 0;
    let countAlreadyOK   = 0;
    let countToMigrate   = 0;
    let countError       = 0;

    let batch     = db.batch();
    let batchSize = 0;
    let batchNum  = 1;

    for (const docSnap of snap.docs) {
        const data  = docSnap.data();
        const id    = docSnap.id;
        const email = data.email || '(no email)';

        // ── SAFETY GUARD: Never touch Super Admin ────────────────────────────
        if (data.role === 'super_admin') {
            console.log(`  [SKIP — Super Admin]   ${id}   ${email}`);
            countSuperAdmin++;
            continue;
        }

        // ── Already has correct role ─────────────────────────────────────────
        if (data.role === 'manager') {
            console.log(`  [SKIP — Already OK]    ${id}   ${email}`);
            countAlreadyOK++;
            continue;
        }

        // ── Missing or unexpected role — must be migrated ────────────────────
        const currentRole = (data.role !== undefined && data.role !== null)
            ? `"${data.role}"`
            : '(absent)';
        console.log(`  [MIGRATE]              ${id}   ${email}   role=${currentRole} → "manager"`);
        countToMigrate++;

        if (!DRY_RUN) {
            // Only write role: "manager" — no other fields are touched
            batch.update(docSnap.ref, { role: 'manager' });
            batchSize++;

            // Commit when batch reaches limit
            if (batchSize >= 400) {
                try {
                    await batch.commit();
                    console.log(`\n  [Batch ${batchNum} committed — ${batchSize} write(s)]\n`);
                } catch (commitErr) {
                    console.error(`\n  [ERROR] Batch ${batchNum} commit failed:`, commitErr.message);
                    countError++;
                }
                batch     = db.batch();
                batchSize = 0;
                batchNum++;
            }
        }
    }

    // Commit any remaining writes
    if (!DRY_RUN && batchSize > 0) {
        try {
            await batch.commit();
            console.log(`\n  [Batch ${batchNum} committed — ${batchSize} write(s)]\n`);
        } catch (commitErr) {
            console.error(`\n  [ERROR] Final batch commit failed:`, commitErr.message);
            countError++;
        }
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log('\n════════════════════════════════════════════════════════');
    console.log('  Summary');
    console.log('────────────────────────────────────────────────────────');
    console.log(`  Skipped (Super Admin):    ${countSuperAdmin}`);
    console.log(`  Skipped (Already OK):     ${countAlreadyOK}`);
    console.log(`  ${DRY_RUN ? 'Would migrate:' : 'Migrated:        '}         ${countToMigrate}`);
    if (countError > 0) {
        console.log(`  Errors:                   ${countError}`);
    }
    console.log('════════════════════════════════════════════════════════\n');

    if (DRY_RUN && countToMigrate > 0) {
        console.log('  ⚠️  No changes were written (dry-run mode).');
        console.log('  Re-run with DRY_RUN=false to apply the migration.\n');
    } else if (!DRY_RUN && countToMigrate > 0 && countError === 0) {
        console.log('  ✅ Migration completed successfully.\n');
    } else if (!DRY_RUN && countError > 0) {
        console.log('  ⚠️  Migration completed with errors. Review output above.\n');
        process.exit(1);
    } else {
        console.log('  ✅ No documents required migration.\n');
    }

    process.exit(0);
}

run().catch(err => {
    console.error('\n[Migration] Fatal error:', err.message, err.stack);
    process.exit(1);
});
