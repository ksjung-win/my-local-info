const GEMINI_API_KEY = "AIzaSyBNsHQxdzX66-5_MB3PTw8c5LmgbATdY5g";
const fs = require('fs');

async function testModel(apiVersion, modelName) {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
    });
    const result = await response.json();
    return `${apiVersion} - ${modelName}: ${result.error ? result.error.message : "SUCCESS"}`;
  } catch (e) {
    return `${apiVersion} - ${modelName} EXCEPTION: ${e.message}`;
  }
}

async function run() {
  const res1 = await testModel("v1", "gemini-1.5-flash");
  const res2 = await testModel("v1beta", "gemini-1.5-flash");
  const res3 = await testModel("v1", "gemini-pro");
  const res4 = await testModel("v1beta", "gemini-pro");
  const res5 = await testModel("v1beta", "gemini-1.5-pro");
  
  const total = [res1, res2, res3, res4, res5].join("\n");
  fs.writeFileSync("c:/Users/정교선/OneDrive/Desktop/al-local-info/gemini_results.txt", total);
  console.log("Results written to gemini_results.txt");
}

run();
