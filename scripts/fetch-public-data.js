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

    // 필터링 로직 (성남 -> 경기 -> 전체 순서로 검색 범위 확대)
    const checkKeyword = (item, keywords) => {
      const fields = [item.서비스명, item.서비스목적요약, item.지원대상, item.소관기관명];
      return keywords.some(keyword => 
        fields.some(field => field && field.includes(keyword))
      );
    };

    let filtered = rawData.filter(item => checkKeyword(item, ["성남", "분당", "판교", "수정구", "중원구"]));
    if (filtered.length === 0) {
      console.log("성남 관련 데이터가 없어 '경기'로 범위를 넓힙니다.");
      filtered = rawData.filter(item => checkKeyword(item, ["경기"]));
    }
    if (filtered.length === 0) {
      console.log("경기 관련 데이터가 없어 전체 데이터를 대상으로 합니다.");
      filtered = rawData;
    }

    // [2단계] 기존 데이터와 비교
    const dataPath = path.join(process.cwd(), "public", "data", "local-info.json");
    const existingFile = fs.readFileSync(dataPath, "utf-8");
    const db = JSON.parse(existingFile);
    const existingNames = new Set(db.items.map(item => item.name));

    const newItems = filtered.filter(item => !existingNames.has(item.서비스명));

    if (newItems.length === 0) {
      console.log("새로운 데이터가 없습니다. 기존 데이터 중 무작위로 하나를 선택하거나 오늘은 건너뜁니다.");
      // 새로운 데이터가 없으면 종료 (중복 방지)
      return;
    }

    // 새 항목 중 하나 선택
    const targetItem = newItems[0];

    // [3단계] Gemini AI로 새 항목 가공
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const today = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const prompt = `아래 공공데이터 1건을 분석해서 반드시 JSON 객체 형식으로만 변환해줘. 다른 텍스트는 절대 포함하지 마.
{
  "id": 숫자,
  "name": "서비스명",
  "category": "행사" 또는 "혜택",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "location": "장소 또는 기관명",
  "target": "지원대상",
  "summary": "핵심 내용을 포함한 한줄요약 (50자 내외)",
  "link": "상세정보 확인 가능한 URL (없으면 데이터의 상세주소 또는 원문안내 URL 사용)"
}

category는 축제, 전시, 공연, 교육 등 일시적인 것이면 '행사', 지원금, 바우처, 상시 서비스면 '혜택'으로 분류해.
startDate가 없으면 오늘(${today})로 넣어.
endDate가 없어나 찾기 어려우면 '상시'라고 적어.

데이터: ${JSON.stringify(targetItem)}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`Gemini API 오류 (${geminiResponse.status}):`, errorText);
      return;
    }

    const geminiResult = await geminiResponse.json();
    
    if (!geminiResult.candidates || !geminiResult.candidates[0].content || !geminiResult.candidates[0].content.parts[0].text) {
      console.error("Gemini API로부터 올바른 응답을 받지 못했습니다. 응답 객체:", JSON.stringify(geminiResult, null, 2));
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
    db.lastUpdated = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];

    fs.writeFileSync(dataPath, JSON.stringify(db, null, 2), "utf-8");
    console.log(`성공: [${newItem.name}] 항목이 추가되었습니다.`);

  } catch (error) {
    console.error("스크립트 실행 중 오류 발생:", error);
    // 에러 발생 시 기존 파일을 유지하므로 추가 조치 없음
  }
}

fetchPublicData();
