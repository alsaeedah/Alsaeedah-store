import { db } from './config.js';

async function seedFallbacks() {
    console.log('Seeding fallbacks...');
    
    // Check if 'General' category exists by slug
    const cats = await db.collection('taxonomy_categories').where('slug', '==', 'general').get();
    if (cats.empty) {
        await db.collection('taxonomy_categories').add({
            name: 'General',
            slug: 'general',
            description: 'Default category for unmapped products',
            active: true,
            order: 999
        });
        console.log('Created General category.');
    } else {
        console.log('General category already exists.');
    }

    const brands = await db.collection('taxonomy_brands').where('name', '==', 'General').get();
    if (brands.empty) {
        await db.collection('taxonomy_brands').add({
            name: 'General',
            description: 'Default brand for unmapped products',
            active: true,
            order: 999
        });
        console.log('Created General brand.');
    } else {
        console.log('General brand already exists.');
    }
}

seedFallbacks().then(() => {
    console.log('Done.');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
