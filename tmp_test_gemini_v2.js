const GEMINI_API_KEY = "AIzaSyBNsHQxdzX66-5_MB3PTw8c5LmgbATdY5g";

async function testModel(apiVersion, modelName) {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
    });
    const result = await response.json();
    console.log(`${apiVersion} - ${modelName}:`, result.error ? result.error.message : "SUCCESS");
  } catch (e) {
    console.log(`${apiVersion} - ${modelName} error:`, e.message);
  }
}

async function run() {
  await testModel("v1", "gemini-1.5-flash");
  await testModel("v1", "gemini-pro");
}

run();
