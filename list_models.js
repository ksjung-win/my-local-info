const GEMINI_API_KEY = "AIzaSyBNsHQxdzX66-5_MB3PTw8c5LmgbATdY5g";

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(url);
    const result = await response.json();
    if (result.models) {
      console.log("Available models:");
      result.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log("Error listing models:", result.error ? result.error.message : JSON.stringify(result));
    }
  } catch (e) {
    console.log("EXCEPTION:", e.message);
  }
}

listModels();
