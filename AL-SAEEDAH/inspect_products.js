
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
    } catch (e) { return {}; }
};

const env = parseEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    console.log("Inspecting 'products' table...");
    try {
        // Check if we can fetch even 1 product with a simple query
        const { data, error, status } = await supabase.from('products').select('id').limit(1);
        console.log("Simple query status:", status);
        if (error) console.error("Simple query error:", error);
        else console.log("Simple query success, data:", data);

        // Check columns
        const { data: cols, error: cError } = await supabase.rpc('get_table_columns', { table_name: 'products' });
        if (cError) {
             console.log("RPC get_table_columns failed (expected if not defined). Trying standard query...");
        } else {
            console.log("Columns:", cols);
        }

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

inspect();
