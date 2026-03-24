const fs = require('fs');
const path = require('path');

async function fetchPublicData() {
  try {
    const PUBLIC_DATA_API_KEY = process.env.PUBLIC_DATA_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!PUBLIC_DATA_API_KEY || !GEMINI_API_KEY) {
      console.error("환경 변수(PUBLIC_DATA_API_KEY, GEMINI_API_KEY)가 설정되어 있지 않습니다.");
      return;
    }

    // [1단계] 공공데이터포털 API에서 데이터 가져오기
    const baseUrl = "https://api.odcloud.kr/api/gov24/v3/serviceList";
    const queryParams = new URLSearchParams({
      page: "1",
      perPage: "20",
      returnType: "JSON",
      serviceKey: PUBLIC_DATA_API_KEY
    });

    const response = await fetch(`${baseUrl}?${queryParams.toString()}`);
    const result = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
      console.error("데이터를 불러오지 못했거나 데이터 형식이 올바르지 않습니다.");
      return;
    }

    const rawData = result.data;

    // 필터링 로직
    const checkKeyword = (item, keyword) => {
      const fields = [item.서비스명, item.서비스목적요약, item.지원대상, item.소관기관명];
      return fields.some(field => field && field.includes(keyword));
    };

    let filtered = rawData.filter(item => checkKeyword(item, "성남"));
    if (filtered.length === 0) {
      filtered = rawData.filter(item => checkKeyword(item, "경기"));
    }
    if (filtered.length === 0) {
      filtered = rawData;
    }

    // [2단계] 기존 데이터와 비교
    const dataPath = path.join(process.cwd(), "public", "data", "local-info.json");
    const existingFile = fs.readFileSync(dataPath, "utf-8");
    const db = JSON.parse(existingFile);
    const existingNames = new Set(db.items.map(item => item.name));

    const newItems = filtered.filter(item => !existingNames.has(item.서비스명));

    if (newItems.length === 0) {
      console.log("새로운 데이터가 없습니다");
      return;
    }

    // 가장 위에 있는 새 항목 1개 선택
    const targetItem = newItems[0];

    // [3단계] Gemini AI로 새 항목 1개만 가공
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `아래 공공데이터 1건을 분석해서 JSON 객체로 변환해줘. 형식:
{id: 숫자, name: 서비스명, category: '행사' 또는 '혜택', startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', location: 장소 또는 기관명, target: 지원대상, summary: 한줄요약, link: 상세URL}
category는 내용을 보고 행사/축제면 '행사', 지원금/서비스면 '혜택'으로 판단해.
startDate가 없으면 오늘 날짜, endDate가 없으면 '상시'로 넣어.
반드시 JSON 객체만 출력해. 다른 텍스트 없이.

데이터: ${JSON.stringify(targetItem)}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const geminiResult = await geminiResponse.json();
    
    if (!geminiResult.candidates || !geminiResult.candidates[0].content.parts[0].text) {
      console.error("Gemini API로부터 올바른 응답을 받지 못했습니다.");
      return;
    }

    let aiText = geminiResult.candidates[0].content.parts[0].text;
    
    // 마크다운 코드 블록 제거 및 순수 JSON 추출
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    const newItem = JSON.parse(aiText);

    // 고유 ID 부여 (기존 ID 중 최대값 + 1)
    const maxId = db.items.reduce((max, item) => Math.max(max, item.id || 0), 0);
    newItem.id = maxId + 1;

    // [4단계] 기존 데이터에 추가
    db.items.push(newItem);
    db.lastUpdated = new Date().toISOString().split("T")[0];

    fs.writeFileSync(dataPath, JSON.stringify(db, null, 2), "utf-8");
    console.log(`성공: [${newItem.name}] 항목이 추가되었습니다.`);

  } catch (error) {
    console.error("스크립트 실행 중 오류 발생:", error);
    // 에러 발생 시 기존 파일을 유지하므로 추가 조치 없음
  }
}

fetchPublicData();
