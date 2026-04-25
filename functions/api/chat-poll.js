export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const filterSender = url.searchParams.get("sender");

    // 1. 메시지 키 목록 조회 (prefix 활용)
    const list = await env.CHAT_KV.list({ prefix: "msg_" });
    
    // 2. 각 키에 해당하는 데이터 가져오기
    const messages = await Promise.all(
      list.keys.map(async (key) => {
        const val = await env.CHAT_KV.get(key.name);
        return JSON.parse(val);
      })
    );

    // 3. 타임스탬프 순으로 정렬
    messages.sort((a, b) => a.timestamp - b.timestamp);

    // 4. 필터링 (sender 파라미터가 있는 경우)
    const result = filterSender 
      ? messages.filter(m => m.sender === filterSender)
      : messages;

    return new Response(JSON.stringify(result), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
