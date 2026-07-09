
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function inspectSchema() {
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

    console.log("Checking users table count...");
    const { count: userCount, error: userError } = await supabase.from('users').select('*', { count: 'exact', head: true });
    console.log("Users count:", userCount, "Error:", userError?.message);

    console.log("Checking profiles table count (legacy check)...");
    const { count: profileCount, error: profileError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    console.log("Profiles count:", profileCount, "Error:", profileError?.message);

    // Try a broad insert that bypasses auth.uid() = id just to see if ANY insert is allowed
    console.log("Testing open insert (expect failure if RLS is on)...");
    const { error: openError } = await supabase.from('users').insert({ email: 'open@test.com', name: 'Open Test' });
    console.log("Open insert error:", openError?.message);
}

inspectSchema();
