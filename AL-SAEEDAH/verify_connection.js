
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parser since we might not have dotenv installed
const parseEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) return {};
        const content = fs.readFileSync(envPath, 'utf8');
        return content.split('\n').reduce((acc, line) => {
            const [key, ...values] = line.split('=');
            if (key && values) acc[key.trim()] = values.join('=').trim();
            return acc;
        }, {});
    } catch (e) {
        console.error("Error reading .env:", e);
        return {};
    }
};

const env = parseEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Key:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    try {
        const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Connection FAILED:', error.message);
            console.error('Details:', error);
        } else {
            console.log('Connection SUCCESSFUL!');
            console.log('Table "products" exists and is accessible.');
            console.log('Row count:', data === null ? 'Accessible (Head request)' : data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkConnection();
