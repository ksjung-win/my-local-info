const GEMINI_API_KEY = "AIzaSyBNsHQxdzX66-5_MB3PTw8c5LmgbATdY5g"; // From .env.local

async function testModel(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
    });
    const result = await response.json();
    console.log(`Model ${modelName}:`, result.error ? result.error.message : "SUCCESS");
  } catch (e) {
    console.log(`Model ${modelName} error:`, e.message);
  }
}

async function run() {
  await testModel("gemini-1.5-flash");
  await testModel("gemini-1.5-flash-latest");
  await testModel("gemini-pro");
}

run();
