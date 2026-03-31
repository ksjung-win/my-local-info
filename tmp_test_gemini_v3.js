const GEMINI_API_KEY = "AIzaSyBNsHQxdzX66-5_MB3PTw8c5LmgbATdY5g";

async function testModel(apiVersion, modelName) {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Write one word: OK" }] }] })
    });
    const result = await response.json();
    if (result.candidates) {
      console.log(`${apiVersion} - ${modelName}: SUCCESS - ${result.candidates[0].content.parts[0].text.trim()}`);
    } else {
      console.log(`${apiVersion} - ${modelName}: ERROR - ${result.error.message}`);
    }
  } catch (e) {
    console.log(`${apiVersion} - ${modelName} EXCEPTION:`, e.message);
  }
}

async function run() {
  await testModel("v1", "gemini-1.5-flash");
  await testModel("v1beta", "gemini-1.5-flash");
  await testModel("v1", "gemini-pro");
  await testModel("v1beta", "gemini-pro");
}

run();
