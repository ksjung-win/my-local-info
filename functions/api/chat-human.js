export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const { message, text, sender } = body;
    
    // instruction에서는 message를 쓰라고 했지만, 프론트엔드에서는 text를 보낼 수 있으므로 둘 다 대응
    const content = message || text;

    if (!content || !sender) {
      return new Response("Message and sender are required", { status: 400 });
    }

    const timestamp = Date.now();
    const key = `msg_${timestamp}`;
    const value = JSON.stringify({ 
      id: timestamp, // ID로 타임스탬프 활용
      message: content, 
      text: content, // 프론트엔드 호환성을 위해 text로도 저장
      sender, 
      timestamp 
    });

    await env.CHAT_KV.put(key, value);

    return new Response(JSON.stringify({ success: true, id: timestamp }), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
