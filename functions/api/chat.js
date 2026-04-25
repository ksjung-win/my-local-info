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

    // 1. 검색 인덱스 가져오기
    const origin = new URL(request.url).origin;
    const indexResponse = await fetch(`${origin}/data/search-index.json`);
    const searchIndex = await indexResponse.json();

    // 2. 간단한 키워드 매칭 기반 검색 (RAG)
    const keywords = prompt.split(/\s+/).filter(word => word.length > 1);
    const scoredIndex = searchIndex.map(item => {
      let score = 0;
      const searchText = `${item.title} ${item.summary} ${item.content || ""}`;
      keywords.forEach(keyword => {
        if (searchText.includes(keyword)) score += 1;
      });
      return { ...item, score };
    });

    const topMatches = scoredIndex
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const blogContext = topMatches.length > 0 
      ? topMatches.map(m => `제목: ${m.title}\n요약: ${m.summary}`).join("\n\n")
      : "관련 데이터 없음";

    // 3. 시스템 프롬프트 설정
    const systemPrompt = `You are an AI assistant for a Korean local information blog.
Answer ONLY in Korean. Keep answers to 2-3 sentences maximum.
Do NOT use any markdown symbols (**, *, #, -). Plain text only.
Base your answer ONLY on the following blog data. If not relevant, reply: 해당 내용은 블로그에서 확인이 어렵습니다. 다른 질문을 해주세요.

[블로그 데이터]
${blogContext}`;

    // 4. AI 호출
    const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
    });

    // 5. 마크다운 기호 제거 함수
    function stripMarkdown(text) {
      return text.replace(/[*#\-_\[\]()]/g, "").trim();
    }

    if (aiResponse && aiResponse.response) {
      aiResponse.response = stripMarkdown(aiResponse.response);
    }

    return new Response(JSON.stringify(aiResponse), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
