const fs = require('fs');
const path = require('path');

async function generateMissingPosts() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    return;
  }

  const dataPath = path.join(process.cwd(), "public", "data", "local-info.json");
  const postsDir = path.join(process.cwd(), "src", "content", "posts");
  const db = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  
  // Target IDs for festivals
  const targetIds = [1, 2, 3];
  const itemsToGenerate = db.items.filter(item => targetIds.includes(item.id));

  for (const item of itemsToGenerate) {
    console.log(`Generating post for: ${item.name}...`);
    
    const today = new Date().toISOString().split("T")[0];
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `아래 공공서비스 정보를 바탕으로 블로그 글을 작성해줘.
    
정보: ${JSON.stringify(item)}

아래 형식으로 출력해줘:
---
title: (친근하고 흥미로운 제목)
date: ${today}
summary: (한 줄 요약)
category: 정보
tags: [태그1, 태그2, 태그3]
---

(본문 작성 규칙)
1. **글자수 확보**: 반드시 공백 포함 **1,500자 이상**의 풍성한 분량으로 작성해.
2. **가독성 최우선**: 문장은 짧게 쓰고, 빈 줄을 자주 넣어줘.
3. **시각적 요소**: 중요 키워드는 **굵게** 강조하고 이모지 사용.
4. 구성: 인사, 핵심 내용 요약, 상세 지원 내용, 신청 방법, 꿀팁, 맺음말.

마지막 줄에 FILENAME: YYYY-MM-DD-keyword 형식으로 파일명도 출력해줘. 키워드는 영문으로.`;

    try {
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const result = await response.json();
      let aiResponse = result.candidates[0].content.parts[0].text;
      aiResponse = aiResponse.replace(/```markdown/g, "").replace(/```/g, "").trim();

      const filenameMatch = aiResponse.match(/FILENAME:\s*([^\n\r]+)/i);
      let filename = `${today}-${item.id}-festival.md`;
      let content = aiResponse;

      if (filenameMatch) {
        filename = filenameMatch[1].trim();
        if (!filename.endsWith(".md")) filename += ".md";
        content = aiResponse.replace(filenameMatch[0], "").trim();
      }

      fs.writeFileSync(path.join(postsDir, filename), content, "utf-8");
      console.log(`Saved: ${filename}`);
    } catch (e) {
      console.error(`Failed to generate ${item.name}:`, e);
    }
  }
}

generateMissingPosts();
