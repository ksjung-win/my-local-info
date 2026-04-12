const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testModel(version, model) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] })
        });
        const result = await response.json();
        if (response.ok) {
            console.log(`[SUCCESS] ${version} / ${model}`);
        } else {
            console.log(`[FAILED] ${version} / ${model}: ${response.status} - ${result.error ? result.error.message : 'Unknown error'}`);
        }
    } catch (e) {
        console.log(`[ERROR] ${version} / ${model}: ${e.message}`);
    }
}

async function run() {
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash', 'gemini-flash-latest'];
    const versions = ['v1beta', 'v1'];
    for (const v of versions) {
        for (const m of models) {
            await testModel(v, m);
        }
    }
}

run();
