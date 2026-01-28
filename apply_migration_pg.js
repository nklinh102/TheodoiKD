const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manual env parsing since dotenv might not be present
const envConfig = fs.readFileSync('.env.local', 'utf8');
const getEnv = (key) => {
    const match = envConfig.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);


const migrationFile = process.argv[2];
const sql = fs.readFileSync(migrationFile, 'utf8');

async function run() {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    // Note: exec_sql is a custom RPC function I assume exists based on previous capability. 
    // If not, I might need to use a direct connection or just psql if available, 
    // but usually in these envs we might just rely on the tool or assume user has setup.
    // Wait, standard supabase-js client doesn't execute arbitrary SQL unless via RPC.

    // Fallback: If exec_sql doesn't exist, we might fail. 
    // Let's try to see if there is a 'scripts/run-migration.ts' or similar in the 'scripts' folder first?
    // The previous error said 'scripts/run_migration.js' not found.

    // Actually, I can likely just ask the user to run it or use a raw pg client if installed.
    // But since I installed 'pg' before (maybe?), let's try 'postgres' package if available.
    // Checking package.json would be wise, but let's try the RPC method first if user has it set up.

    if (error) {
        console.error("RPC Error:", error);
        // If RPC fails (e.g. function not found), we might need to instruct user.
        // But wait, I can try to use the 'run_command' to use psql if 'psql' is in path?
        // No, I don't have password.

        console.log("Attempting to use direct 'postgres' driver if available...");
    } else {
        console.log("Migration applied via RPC success.");
    }
}

// Actually, simpler approach: The user likely has 'postgres' or 'pg' installed for 'next'.
// Let's try to query directly using 'pg' if I can find the connection string.
// But .env.local usually has URL and ANON KEY only for frontend.
// The DATABASE_URL might be there.

// Let's write a script that tries to use 'pg' with DATABASE_URL from .env.local
const { Client } = require('pg');

async function runPg() {
    // Read .env.local manually to find DATABASE_URL
    const envConfig = fs.readFileSync('.env.local', 'utf8');
    const dbUrlMatch = envConfig.match(/DATABASE_URL=(.*)/);

    if (!dbUrlMatch) {
        console.error("No DATABASE_URL found in .env.local");
        return;
    }

    const client = new Client({
        connectionString: dbUrlMatch[1].trim(),
        ssl: { rejectUnauthorized: false } // Supabase requires SSL
    });

    try {
        await client.connect();
        await client.query(sql);
        console.log("Migration applied successfully via PG.");
    } catch (err) {
        console.error("PG Error:", err);
    } finally {
        await client.end();
    }
}

runPg();
// run();
