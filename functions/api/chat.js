export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return new Response("Prompt is required", { status: 400 });
    }

    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "You are an AI assistant for a Korean local information blog. Answer in Korean." },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
    });

    return new Response(JSON.stringify(response), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
