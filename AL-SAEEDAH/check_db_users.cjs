
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkUsers() {
    const envFile = fs.readFileSync('.env', 'utf8');
    const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
    const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
    
    if (!urlMatch || !keyMatch) {
        console.error("No credentials found in .env");
        return;
    }

    const supabaseUrl = urlMatch[1].trim();
    const supabaseAnonKey = keyMatch[1].trim();

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log("Checking users table...");
    const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' });

    if (error) {
        console.error("Error fetching users:", error);
    } else {
        console.log(`Total users in public.users: ${count}`);
        console.log("Users:", data);
    }
}

checkUsers();
