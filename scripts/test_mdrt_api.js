async function testMdrtApi() {
    try {
        const res = await fetch('http://localhost:3000/api/mdrt/agents');
        const result = await res.json();
        console.log("API Success:", result.success);
        console.log("Meta:", result.meta);
        if (result.data && result.data.length > 0) {
            console.log("First Agent FYP:", result.data[0].fyp_issued);
            console.log("First Agent Name:", result.data[0].full_name);
        }
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

testMdrtApi();
