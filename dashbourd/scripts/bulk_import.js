import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN
});

const db = getFirestore(app);

// Data structure
const MANIFEST_PATH = path.join(__dirname, 'bulk_import_manifest.json');
const TARGET_GLASSES = 70;
const TARGET_WALLETS = 85;
const TARGET_WATCHES = 100;
const TOTAL_TARGET = 255;

// Taxonomies
const CATEGORIES = {
    Glasses: 'In6tsq8ohDfiX3uSq3Nz',
    Wallets: '1zO8g6U6XxnDNfltO9pM',
    Watches: 'XTdqaspJR7BG6GGxrYJk'
};

const NEW_BRANDS = {
    Glasses: ['Ray-Ban', 'Oakley', 'Carrera', 'Polaroid', 'Vogue Eyewear', 'Persol', 'Armani Exchange'],
    Wallets: ['Fossil', 'Tommy Hilfiger', 'Calvin Klein', 'Guess', 'Levi\'s', 'Samsonite', 'Polo Ralph Lauren'],
    Watches: ['Casio', 'Seiko', 'Citizen', 'Fossil Watch', 'Tissot', 'Timex', 'Orient', 'Swatch']
};

const GENDERS = ['men', 'women', 'kids'];
const COLORS = ['أسود', 'بني', 'فضي', 'ذهبي', 'أزرق', 'رمادي', 'أبيض', 'أحمر', 'وردي'];
const MATERIALS_WATCHES = ['ستانلس ستيل', 'جلد طبيعي', 'سيليكون', 'تيتانيوم'];
const MATERIALS_GLASSES = ['معدن', 'بلاستيك', 'أسيتات', 'تيتانيوم'];
const MATERIALS_WALLETS = ['جلد طبيعي', 'جلد صناعي', 'قماش'];

const IMAGES = {
    Glasses: [
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
        'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&q=80',
        'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80',
        'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80',
        'https://images.unsplash.com/photo-1483412033650-1015dce15911?w=800&q=80',
        'https://images.unsplash.com/photo-1556306535-0f09a536f01f?w=800&q=80',
        'https://images.unsplash.com/photo-1582522774900-76023348dcf7?w=800&q=80'
    ],
    Wallets: [
        'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
        'https://images.unsplash.com/photo-1606501128169-144a2df84fb0?w=800&q=80',
        'https://images.unsplash.com/photo-1559564114-561b36585141?w=800&q=80',
        'https://images.unsplash.com/photo-1549417229-aa67d3263c09?w=800&q=80',
        'https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?w=800&q=80',
        'https://images.unsplash.com/photo-1526362540608-4e8c14820713?w=800&q=80'
    ],
    Watches: [
        'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80',
        'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80',
        'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=800&q=80',
        'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=800&q=80',
        'https://images.unsplash.com/photo-1587836374828-cb4387061d0d?w=800&q=80',
        'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800&q=80',
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
    ]
};

// Utilities
const randEl = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateUniqueDisplayId = (index) => 900000 + index; // Fixed range for test products to avoid conflict

const generateProduct = (type, categoryId, brandMap, index) => {
    const brandName = randEl(NEW_BRANDS[type]);
    const brandId = brandMap[brandName];
    const image = randEl(IMAGES[type]);
    const price = randInt(150, 1500);
    const hasOldPrice = Math.random() > 0.5;
    const old_price = hasOldPrice ? Math.floor(price * 1.3) : null;
    const gender = randEl(GENDERS);
    
    let name = '';
    let description = '';
    let materials = [];
    
    if (type === 'Glasses') {
        const shape = randEl(['Aviator', 'Wayfarer', 'Round', 'Square', 'Cat-eye', 'Sport']);
        name = `${brandName} ${shape} نظارة شمسية`;
        description = `نظارة شمسية عالية الجودة من ${brandName}. التصميم: ${shape}. توفر حماية فائقة من الأشعة فوق البنفسجية ومناسبة للاستخدام اليومي. مثالية لإضافة لمسة عصرية لإطلالتك. منتج تجريبي رقم ${index}.`;
        materials = [randEl(MATERIALS_GLASSES)];
    } else if (type === 'Wallets') {
        const model = randEl(['Bifold', 'Trifold', 'Card Holder', 'Zip', 'Compact']);
        name = `${brandName} محفظة ${model}`;
        description = `محفظة أصلية من ${brandName}. الموديل: ${model}. مصممة لتتسع للبطاقات والنقود بشكل آمن وعملي مع مظهر أنيق وجذاب. منتج تجريبي رقم ${index}.`;
        materials = [randEl(MATERIALS_WALLETS)];
    } else {
        const style = randEl(['Classic', 'Sport', 'Chronograph', 'Digital', 'Luxury']);
        name = `${brandName} ساعة ${style}`;
        description = `ساعة فاخرة من ${brandName} بتصميم ${style}. تتميز بدقة عالية ومقاومة للماء. الخيار الأمثل للارتداء اليومي أو المناسبات الرسمية. منتج تجريبي رقم ${index}.`;
        materials = [randEl(MATERIALS_WATCHES)];
    }

    const displayId = generateUniqueDisplayId(index);

    return {
        displayId,
        name,
        price,
        old_price,
        categoryId,
        brandId,
        genderId: gender,
        category: '', // Legacy
        style: '', // Legacy
        description,
        video: '',
        imageUrl: image,
        images: [image, image],
        colors: [randEl(COLORS), randEl(COLORS)],
        materials,
        variants: [],
        featured: Math.random() > 0.8,
        created_at: new Date().toISOString(),
        isTestProduct: true, // Marker for safe cleanup
    };
};

async function run() {
    console.log("Starting Test Data Bulk Import...");

    if (fs.existsSync(MANIFEST_PATH)) {
        console.log(`[WARN] Manifest file already exists at ${MANIFEST_PATH}. This indicates a previous test import.`);
        console.log("To prevent duplicates and maintain idempotency, checking if products already exist...");
        // Actually, we can just proceed to check the database itself.
    }

    try {
        // 1. Fetch Existing Brands
        console.log("Fetching existing brands...");
        const brandsSnap = await getDocs(collection(db, 'brands'));
        const existingBrands = {};
        brandsSnap.docs.forEach(doc => {
            existingBrands[doc.data().name] = doc.id;
        });

        // 2. Create Missing Brands (Safely, as Test Brands)
        console.log("Creating required test brands...");
        const brandMap = { ...existingBrands };
        const createdBrandIds = [];
        const brandsBatch = writeBatch(db);
        let brandBatchCount = 0;

        for (const type of Object.keys(NEW_BRANDS)) {
            for (const brandName of NEW_BRANDS[type]) {
                if (!brandMap[brandName]) {
                    const newBrandRef = doc(collection(db, 'brands'));
                    const categoryId = CATEGORIES[type];
                    brandsBatch.set(newBrandRef, {
                        name: brandName,
                        categoryIds: [categoryId],
                        isTestBrand: true, // Marker for safe cleanup
                        created_at: new Date().toISOString()
                    });
                    brandMap[brandName] = newBrandRef.id;
                    createdBrandIds.push(newBrandRef.id);
                    brandBatchCount++;
                }
            }
        }

        if (brandBatchCount > 0) {
            await brandsBatch.commit();
            console.log(`Created ${brandBatchCount} new test brands.`);
        } else {
            console.log("All required test brands already exist.");
        }

        // 3. Verify Existing Test Products
        console.log("Verifying idempotency (checking for existing test products by displayId range 900000+)...");
        const productsSnap = await getDocs(
            query(collection(db, 'products'), where('displayId', '>=', 900000), where('displayId', '<=', 900255))
        );
        
        if (!productsSnap.empty) {
            console.error(`[ERROR] Found ${productsSnap.docs.length} existing test products in the displayId range.`);
            console.error("Aborting import to prevent duplicates. Please clean up the existing test dataset first.");
            process.exit(1);
        }

        // 4. Generate Products
        console.log(`Generating ${TOTAL_TARGET} diverse test products...`);
        const products = [];
        let index = 1;

        // Glasses
        for (let i = 0; i < TARGET_GLASSES; i++) {
            products.push(generateProduct('Glasses', CATEGORIES.Glasses, brandMap, index++));
        }
        // Wallets
        for (let i = 0; i < TARGET_WALLETS; i++) {
            products.push(generateProduct('Wallets', CATEGORIES.Wallets, brandMap, index++));
        }
        // Watches
        for (let i = 0; i < TARGET_WATCHES; i++) {
            products.push(generateProduct('Watches', CATEGORIES.Watches, brandMap, index++));
        }

        if (products.length !== TOTAL_TARGET) {
            throw new Error(`Generated ${products.length} products instead of ${TOTAL_TARGET}. Aborting.`);
        }

        // 5. Commit Products in Batches
        // Firestore batch limit is 500, so we can do all 255 in one batch
        console.log("Writing products to Firestore...");
        const productsBatch = writeBatch(db);
        const importedProductIds = [];

        products.forEach(prod => {
            const docRef = doc(collection(db, 'products'));
            productsBatch.set(docRef, prod);
            importedProductIds.push(docRef.id);
        });

        await productsBatch.commit();
        console.log("Successfully committed products batch.");

        // 6. Write Manifest
        const manifest = {
            timestamp: new Date().toISOString(),
            totalProducts: products.length,
            createdBrandIds,
            importedProductIds,
            notes: "This manifest tracks test data. Do not delete this file if you wish to clean up later."
        };

        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
        console.log(`Manifest written to ${MANIFEST_PATH}`);

        // 7. Verify Results
        console.log("Verifying final counts in Firestore...");
        
        let finalGlasses = 0;
        let finalWallets = 0;
        let finalWatches = 0;
        
        // Using chunks to verify since we have the importedProductIds
        // Fetching 10 at a time to be safe, or just checking the local products array logic.
        // Let's actually fetch the count from Firestore for our test products.
        const testProductsSnap = await getDocs(query(collection(db, 'products'), where('isTestProduct', '==', true)));
        
        testProductsSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.categoryId === CATEGORIES.Glasses) finalGlasses++;
            else if (data.categoryId === CATEGORIES.Wallets) finalWallets++;
            else if (data.categoryId === CATEGORIES.Watches) finalWatches++;
        });

        console.log(`\nTest Dataset Import Completed`);
        console.log(`Glasses: ${finalGlasses}`);
        console.log(`Wallets: ${finalWallets}`);
        console.log(`Watches: ${finalWatches}`);
        console.log(`Total: ${testProductsSnap.docs.length}`);
        
        console.log(`\nBrands created: ${createdBrandIds.length}`);
        console.log(`Products imported: ${importedProductIds.length}`);
        console.log(`Manifest: ${MANIFEST_PATH}`);
        
        console.log("\n[SUCCESS] The dataset is safely identifiable via 'isTestProduct: true' and 'isTestBrand: true' flags, as well as the manifest file, and can be removed later without affecting production data.");

    } catch(e) {
        console.error("ERROR during import:", e);
        process.exit(1);
    }
}

run();
