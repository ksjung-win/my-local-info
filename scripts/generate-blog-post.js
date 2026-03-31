const fs = require('fs');
const path = require('path');

async function generateBlogPost() {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("환경 변수(GEMINI_API_KEY)가 설정되어 있지 않습니다.");
      return;
    }

    // [1단계] 최신 데이터 확인
    const dataPath = path.join(process.cwd(), "public", "data", "local-info.json");
    if (!fs.existsSync(dataPath)) {
      console.error("데이터 파일(local-info.json)이 존재하지 않습니다.");
      return;
    }

    const db = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    if (!db.items || db.items.length === 0) {
      console.log("처리할 데이터가 없습니다.");
      return;
    }

    const lastItem = db.items[db.items.length - 1];
    const postsDir = path.join(process.cwd(), "src", "content", "posts");
    
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    // 이미 같은 name으로 글이 있는지 확인 (파일명 또는 본문 내용 검색)
    const existingFiles = fs.readdirSync(postsDir);
    const isAlreadyWritten = existingFiles.some(file => {
      if (!file.endsWith(".md")) return false;
      const content = fs.readFileSync(path.join(postsDir, file), "utf-8");
      return content.includes(lastItem.name);
    });

    if (isAlreadyWritten) {
      console.log("이미 작성된 글입니다");
      return;
    }

    // [2단계] Gemini AI로 블로그 글 생성
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const today = new Date().toISOString().split("T")[0];

    const prompt = `아래 공공서비스 정보를 바탕으로 블로그 글을 작성해줘.

정보: ${JSON.stringify(lastItem)}

아래 형식으로 출력해줘. 반드시 이 형식만 출력하고 다른 텍스트는 없이:
---
title: (친근하고 흥미로운 제목)
date: ${today}
summary: (한 줄 요약)
category: 정보
tags: [태그1, 태그2, 태그3]
---

(본문 작성 규칙)
1. **가독성 최우선**: 문장은 짧게 쓰고, 2~3문장마다 문단을 나누어 빈 줄(Line Break)을 두 번 넣어서 빽빽하지 않게 작성해.
2. **시각적 요소**: 중요 키워드는 **굵게** 강조하고, 적절한 이모지를 사용하여 친근하게 작성해.
3. **구조화**: ### 소제목을 활용하여 내용을 체계적으로 나누고, 목록이나 불렛 포인트를 적극 활용해.
4. **구성**:
   - 인사 및 도입부 (친근하게)
   - ### 💡 핵심 내용 요약 (간략히)
   - ### ✅ 이런 분들께 추천해요 (3가지 이유)
   - ### 📝 신청 방법은? (상세 절차 및 링크 안내)
   - 맺음말 (응원의 메시지)

마지막 줄에 FILENAME: YYYY-MM-DD-keyword 형식으로 파일명도 출력해줘. 키워드는 영문으로.`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    if (!result.candidates || !result.candidates[0].content || !result.candidates[0].content.parts[0].text) {
      console.error("Gemini API 응답이 올바르지 않습니다. 응답 객체:", JSON.stringify(result, null, 2));
      return;
    }

    let aiResponse = result.candidates[0].content.parts[0].text;
    
    // 마크다운 코드 블록 제거
    aiResponse = aiResponse.replace(/```markdown/g, "").replace(/```/g, "").trim();

    // FILENAME 추출
    const filenameMatch = aiResponse.match(/FILENAME:\s*([^\n\r]+)/i);
    let filename = "";
    let finalPostContent = aiResponse;

    if (filenameMatch) {
      let rawFilename = filenameMatch[1].trim();
      // AI가 과거 날짜를 포함하더라도 항상 오늘 날짜(today)를 앞에 붙이도록 강제
      const keyword = rawFilename.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");
      filename = `${today}-${keyword}.md`;
      
      // 본문에서 FILENAME 라인 제거
      finalPostContent = aiResponse.replace(filenameMatch[0], "").trim();
    } else {
      // 파일명이 없을 경우 기본값 생성
      filename = `${today}-new-post.md`;
    }

    // [3단계] 파일 저장
    const targetPath = path.join(postsDir, filename);
    fs.writeFileSync(targetPath, finalPostContent, "utf-8");

    console.log(`성공: [${filename}] 블로그 글이 생성되었습니다.`);

  } catch (error) {
    console.error("스크립트 실행 중 오류 발생:", error);
  }
}

generateBlogPost();
