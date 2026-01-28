const { createClient } = require('@supabase/supabase-js');

async function checkSopNames() {
    const supabaseUrl = 'https://zjjgctclgkkjcqvuxfaw.supabase.co';
    const supabaseKey = 'sb_publishable_TyUGpjacx60LvwLb89gTTg_4QmwJFqZ';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.from('sop_data').select('*').limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    data.forEach(r => {
        console.log(`Agent: ${r.agent_code}`);
        console.log(`- Tên Đại lý: "${r.data['Tên Đại lý']}"`);
        console.log(`- Tên đầy đủ Đại lý: "${r.data['Tên đầy đủ Đại lý']}"`);
        console.log(`- Tên ĐL: "${r.data['Tên ĐL']}"`);
    });
}

checkSopNames();
