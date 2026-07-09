
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const parseEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const content = fs.readFileSync(envPath, 'utf8');
        return content.split('\n').reduce((acc, line) => {
            const [key, ...values] = line.split('=');
            if (key && values) acc[key.trim()] = values.join('=').trim();
            return acc;
        }, {});
    } catch (e) {
        return {};
    }
};

const env = parseEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testConnection() {
    console.log('Testing connection to:', env.VITE_SUPABASE_URL);

    // 1. Check if we can select
    console.log('Attempting SELECT...');
    const select = await supabase.from('products').select('count', { count: 'exact', head: true });

    if (select.error) {
        console.error('SELECT Failed:', select.error.message);
    } else {
        console.log('SELECT Success. Count:', select.count);
    }

    // 2. Check if we can insert (permissions)
    console.log('Attempting INSERT...');
    const insert = await supabase.from('products').insert([{
        name: 'Test Product',
        price: 100,
        description: 'Test',
        category: 'men',
        style: 'classic',
        displayId: 999999
    }]).select();

    if (insert.error) {
        console.error('INSERT Failed:', insert.error.message);
        console.log('Full Error:', insert.error);
    } else {
        console.log('INSERT Success:', insert.data);
        // Clean up
        await supabase.from('products').delete().eq('displayId', 999999);
    }
}

testConnection();
