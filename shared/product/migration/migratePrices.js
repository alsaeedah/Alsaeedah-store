/**
 * migratePrices.js
 *
 * One-time migration: ensures all product documents store price, old_price,
 * and variants[].price as JavaScript Numbers rather than strings.
 *
 * Uses the existing Admin SDK setup from config.js.
 *
 * Usage:
 *   node migratePrices.js dry-run   # Logs what would change — zero Firestore writes
 *   node migratePrices.js execute   # Applies corrections in batches (modifies Firestore!)
 *
 * Guarantees:
 *   - Idempotent: running twice makes no unnecessary writes.
 *   - Non-destructive: only `price`, `old_price`, `variants[].price` are touched.
 *   - Auditable: prints a full summary including invalid values.
 *   - Never converts invalid values to 0.
 *   - Never writes NaN, Infinity, or -Infinity to Firestore.
 */

import { db } from './config.js';

const MODE = process.argv[2]; // 'dry-run' | 'execute'
const IS_DRY_RUN = MODE !== 'execute';
const BATCH_SIZE = 400; // Firestore writeBatch cap is 500 ops; we stay well under

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Attempts to convert a value to a valid finite Number.
 * Returns { valid: true, value: Number } or { valid: false, reason: string }.
 */
function tryConvertPrice(value) {
    // Already a valid Number: nothing to do
    if (typeof value === 'number') {
        if (!isFinite(value)) {
            return { valid: false, reason: `Non-finite number: ${value}` };
        }
        return { valid: true, value, changed: false };
    }

    // Null / undefined: legitimately absent
    if (value === null || value === undefined) {
        return { valid: true, value: null, changed: false, absent: true };
    }

    // String: attempt conversion
    if (typeof value === 'string') {
        if (value.trim() === '') {
            return { valid: false, reason: 'Empty string' };
        }
        const n = Number(value);
        if (!isFinite(n) || isNaN(n)) {
            return { valid: false, reason: `Non-numeric string: "${value}"` };
        }
        return { valid: true, value: n, changed: true };
    }

    // Any other type (boolean, object, etc.)
    return { valid: false, reason: `Unexpected type: ${typeof value} (${JSON.stringify(value)})` };
}

/**
 * Inspects a single product document and computes what corrections are needed.
 *
 * @param {string} docId
 * @param {Object} data - Raw Firestore document data
 * @returns {{ needsUpdate: boolean, updates: Object, invalidFields: Array }}
 */
function inspectProduct(docId, data) {
    const updates = {};
    const invalidFields = [];
    let needsUpdate = false;

    // ── price (required) ──────────────────────────────────────────────────
    const priceResult = tryConvertPrice(data.price);
    if (!priceResult.valid) {
        invalidFields.push({ field: 'price', reason: priceResult.reason });
    } else if (priceResult.changed) {
        updates.price = priceResult.value;
        needsUpdate = true;
    }

    // ── old_price (optional) ──────────────────────────────────────────────
    if ('old_price' in data) {
        const opResult = tryConvertPrice(data.old_price);
        if (!opResult.valid) {
            invalidFields.push({ field: 'old_price', reason: opResult.reason });
        } else if (opResult.changed && !opResult.absent) {
            updates.old_price = opResult.value;
            needsUpdate = true;
        }
    }

    // ── variants[].price (optional array) ─────────────────────────────────
    if (Array.isArray(data.variants) && data.variants.length > 0) {
        let variantsNeedUpdate = false;
        const correctedVariants = data.variants.map((v, i) => {
            if (!v || !('price' in v)) return v;

            const vpResult = tryConvertPrice(v.price);
            if (!vpResult.valid) {
                invalidFields.push({ field: `variants[${i}].price`, reason: vpResult.reason });
                return v; // Leave as-is; report it but don't corrupt it
            }
            if (vpResult.changed && !vpResult.absent) {
                variantsNeedUpdate = true;
                return { ...v, price: vpResult.value };
            }
            return v;
        });

        if (variantsNeedUpdate) {
            updates.variants = correctedVariants;
            needsUpdate = true;
        }
    }

    return { needsUpdate, updates, invalidFields };
}

// ── Main ───────────────────────────────────────────────────────────────────

const run = async () => {
    console.log('\n══════════════════════════════════════════════════════════');
    console.log(` Product Price Migration — ${IS_DRY_RUN ? 'DRY RUN (no writes)' : '⚠️  EXECUTE MODE (writes to Firestore!)'}`);
    console.log('══════════════════════════════════════════════════════════\n');

    console.log('Loading all products...');
    const snapshot = await db.collection('products').get();
    console.log(`Total documents loaded: ${snapshot.docs.length}\n`);

    // Counters
    let alreadyValid = 0;
    let toConvert = 0;
    let invalidCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    const invalidReport = []; // { id, fields: [...] }

    // Gather all docs that need updates
    const toUpdate = []; // { docRef, updates }

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const { needsUpdate, updates, invalidFields } = inspectProduct(docSnap.id, data);

        if (invalidFields.length > 0) {
            invalidCount++;
            invalidReport.push({ id: docSnap.id, fields: invalidFields });
            console.warn(`  [INVALID] ${docSnap.id}: ${invalidFields.map(f => `${f.field} — ${f.reason}`).join(', ')}`);
        }

        if (needsUpdate) {
            toConvert++;
            console.log(`  [CONVERT] ${docSnap.id}: ${Object.keys(updates).join(', ')}`);
            if (!IS_DRY_RUN) {
                toUpdate.push({ docRef: docSnap.ref, updates });
            }
        } else if (invalidFields.length === 0) {
            alreadyValid++;
        }
    }

    // ── Write batches ──────────────────────────────────────────────────────
    if (!IS_DRY_RUN && toUpdate.length > 0) {
        console.log(`\nWriting corrections in batches of ${BATCH_SIZE} ops...`);

        let batch = db.batch();
        let batchOps = 0;
        let batchNum = 0;

        for (const { docRef, updates } of toUpdate) {
            batch.update(docRef, updates);
            batchOps++;

            if (batchOps >= BATCH_SIZE) {
                try {
                    await batch.commit();
                    batchNum++;
                    updatedCount += batchOps;
                    console.log(`  Committed batch ${batchNum} (${batchOps} ops)`);
                } catch (err) {
                    failedCount += batchOps;
                    console.error(`  ERROR committing batch ${batchNum + 1}: ${err.message}`);
                }
                batch = db.batch();
                batchOps = 0;
            }
        }

        // Commit remaining
        if (batchOps > 0) {
            try {
                await batch.commit();
                batchNum++;
                updatedCount += batchOps;
                console.log(`  Committed final batch ${batchNum} (${batchOps} ops)`);
            } catch (err) {
                failedCount += batchOps;
                console.error(`  ERROR committing final batch: ${err.message}`);
            }
        }
    }

    // ── Summary ────────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════════════');
    console.log(' MIGRATION SUMMARY');
    console.log('══════════════════════════════════════════════════════════');
    console.log(`  Total products scanned:     ${snapshot.docs.length}`);
    console.log(`  Already fully valid:         ${alreadyValid}`);
    console.log(`  Require conversion:          ${toConvert}`);
    console.log(`  Invalid values found:        ${invalidCount}`);

    if (IS_DRY_RUN) {
        console.log(`\n  [DRY RUN] No Firestore writes were made.`);
        console.log(`  Run with "execute" to apply the ${toConvert} corrections.`);
    } else {
        console.log(`  Documents updated:           ${updatedCount}`);
        console.log(`  Documents failed:            ${failedCount}`);
    }

    if (invalidReport.length > 0) {
        console.log('\n  ⚠️  INVALID VALUE REPORT (not converted — manual review required):');
        invalidReport.forEach(entry => {
            entry.fields.forEach(f => {
                console.log(`    Product ${entry.id} → ${f.field}: ${f.reason}`);
            });
        });
    }

    console.log('══════════════════════════════════════════════════════════\n');
    process.exit(0);
};

run().catch(err => {
    console.error('[migratePrices] Fatal error:', err);
    process.exit(1);
});
