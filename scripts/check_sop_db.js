const { createClient } = require('@supabase/supabase-js');

async function checkSopData() {
    const supabaseUrl = 'https://zjjgctclgkkjcqvuxfaw.supabase.co';
    const supabaseKey = 'sb_publishable_TyUGpjacx60LvwLb89gTTg_4QmwJFqZ';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.from('sop_data').select('*').limit(1);

    if (error) {
        console.error("Error fetching SOP data:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Sample SOP Data Keys:");
        console.log(Object.keys(data[0].data));
        console.log("\nSample Data Values (subset):");
        const subset = {};
        const keys = Object.keys(data[0].data);
        keys.slice(0, 10).forEach(k => subset[k] = data[0].data[k]);
        console.log(subset);
        console.log("\nSearching for 'mdrt' in keys:");
        console.log(keys.filter(k => k.toLowerCase().includes('mdrt')));
        console.log("\nUpload Date:", data[0].upload_date);
    } else {
        console.log("No SOP data found.");
    }
}

checkSopData();
