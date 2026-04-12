async function testModel() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const model = 'gemini-3-pro-preview';
    const version = 'v1beta';
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello' }] }] })
        });
        const result = await response.json();
        console.log(`Status: ${response.status}`);
        if(result.error) console.log(`ErrorMessage: ${result.error.message}`);
    } catch (e) {
        console.error("Fetch threw:", e.message);
    }
}
testModel();
