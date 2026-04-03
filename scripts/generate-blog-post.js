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

    let db;
    try {
      db = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    } catch (e) {
      console.error("데이터 파일 파싱 중 오류 발생. 백업 파일을 확인합니다.");
      const backupPath = dataPath + ".bak";
      if (fs.existsSync(backupPath)) {
        db = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
      } else {
        throw new Error("데이터 파일이 없거나 손상되었습니다.");
      }
    }
    
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
    const today = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];

    const prompt = `아래 공공서비스 정보를 바탕으로 블로그 글을 작성해줘.
    
정보: ${JSON.stringify(lastItem)}

아래 형식으로 출력해줘. 반드시 이 형식만 출력하고 다른 텍스트는 없이:
---
title: (독자의 클릭을 부르는 친근하고 유익한 제목)
date: ${today}
summary: (전체 내용을 관통하는 매력적인 한 줄 요약)
category: ${lastItem.category}
tags: [성남시, ${lastItem.category}, 실생활정보, ${lastItem.name}]
---

(도입부: 해당 정보를 필요로 할 독자의 상황에 공감하며 따뜻하고 친절하게 인사하고 시작해줘.)

### 💡 3줄 핵심 요약 바로가기
- **🎯 누구에게?**: ${lastItem.target}
- **💰 무엇을?**: ${lastItem.summary}
- **📅 언제까지?**: ${lastItem.endDate === "상시" ? "기한 제한 없음" : lastItem.endDate + "까지"}

---

(본문 작성 규칙)
1. **가독성 최우선**: 한 문장은 짧고 간결하게 작성해. 2-3문장마다 문단을 나누고 반드시 빈 줄을 두 번 넣어 시각적 여백을 줘.
2. **풍성한 상세 설명**: ### 소제목을 사용해서 [상세 지원 내용], [신청 방법], [준비물 및 팁] 순서로 아주 자세하게 설명해줘. 분량은 공백 포함 1,500자 이상으로 넉넉하게!
3. **친근한 말투**: "~해요", "~입니다" 등 부드럽고 다정한 존댓말을 사용해.
4. **강조와 이모지**: 중요한 키워드는 **굵게** 표시하고, 문장 곳곳에 적절한 이모지(✨, ✅, 📍 등)를 사용해 활력을 불어넣어줘.

### ✅ 상세 지원 내용 및 자격
(항목별로 나누어 아주 상세하게 설명)

### 📝 신청 방법 및 준비물
(어디서 어떻게 하는지 단계별로 친절하게 안내)

### 🧐 놓치면 후회하는 꿀팁
(2-3가지 유용한 팁이나 유의사항 정리)

맺음말 (축복과 응원의 메시지로 마무리)

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

    // 제목(title)에 콜론(:)이 포함되어 있으면 따옴표로 감싸기 (YAMLException 방지)
    aiResponse = aiResponse.replace(/^title:\s*(.*)$/m, (match, title) => {
      let trimmedTitle = title.trim();
      // 이미 따옴표로 감싸져 있지 않고 콜론이 포함된 경우
      if (trimmedTitle.includes(':') && !(/^["'].*["']$/.test(trimmedTitle))) {
        return `title: "${trimmedTitle.replace(/"/g, '\\"')}"`;
      }
      return `title: "${trimmedTitle}"`;
    });

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
