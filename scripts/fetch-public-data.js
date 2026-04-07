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

    // 오늘 날짜 (KST 기준)
    const todayKst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const todayStr = todayKst.toISOString().split('T')[0];

    // 기존 데이터 읽기 (미리 한 번만 읽음)
    const dataPath = path.join(process.cwd(), "public", "data", "local-info.json");
    const existingFile = fs.readFileSync(dataPath, "utf-8");
    const db = JSON.parse(existingFile);
    const existingNames = new Set(db.items.map(item => item.name));

    let rawData = [];
    let validNewItems = [];
    const maxRetries = 5;

    // [1단계] 공공데이터포털 API에서 데이터 가져오기 (최대 5번 재시도)
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // 매번 1페이지만 조회하면 데이터가 겹치므로 1~50페이지 중 랜덤하게 선택
      const randomPage = Math.floor(Math.random() * 50) + 1;
      const baseUrl = "https://api.odcloud.kr/api/gov24/v3/serviceList";
      const queryParams = new URLSearchParams({
        page: randomPage.toString(),
        perPage: "20",
        returnType: "JSON",
        serviceKey: PUBLIC_DATA_API_KEY
      });

      console.log(`API 조회 중... (시도: ${attempt}/${maxRetries}, 페이지: ${randomPage})`);
      const response = await fetch(`${baseUrl}?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.data || !Array.isArray(result.data)) {
        console.error("데이터를 불러오지 못했거나 데이터 형식이 올바르지 않습니다.");
        continue; // 에러가 나면 다음 시도로 넘어감
      }

      rawData = result.data;

      // 필터링 및 유효성 검사 로직
      const checkKeyword = (item, keywords) => {
        const fields = [item.서비스명, item.서비스목적요약, item.지원대상, item.소관기관명];
        return keywords.some(keyword => 
          fields.some(field => field && field.includes(keyword))
        );
      };

      // 성남 -> 경기 -> 전체 순서로 검색 범위 확대
      let filtered = rawData.filter(item => checkKeyword(item, ["성남", "분당", "판교", "수정구", "중원구"]));
      if (filtered.length === 0) {
        console.log("성남 관련 데이터가 없어 '경기'로 범위를 넓힙니다.");
        filtered = rawData.filter(item => checkKeyword(item, ["경기"]));
      }
      if (filtered.length === 0) {
        console.log("경기 관련 데이터가 없어 전체 데이터를 대상으로 합니다.");
        filtered = rawData;
      }

      // [2단계] 기간 만료 및 중복 제외
      validNewItems = filtered.filter(item => {
        if (existingNames.has(item.서비스명)) return false;
        return true; 
      });

      // 만일 필터링된 새 항목이 있다면 루프 탈출
      if (validNewItems.length > 0) {
        break;
      } else {
        console.log("현재 페이지에 추가할 수 있는 새로운 성남/경기/전체 데이터가 없습니다. 다음 페이지를 시도합니다.");
      }
    }

    if (validNewItems.length === 0) {
      console.log("최대 재시도 횟수를 초과했습니다. 새로운 데이터가 없거나 모두 이미 등록된 항목입니다.");
      // 만약 지역 필터링으로 아무것도 안 남았다면, 전체 rawData 중 중복되지 않은 것 시도
      const anyNewItem = rawData.find(item => !existingNames.has(item.서비스명));
      if (!anyNewItem) {
        console.log("정말로 새로운 데이터가 없습니다. 업데이트를 건너뜁니다.");
        return;
      }
      validNewItems.push(anyNewItem);
    }

    // [3단계] Gemini AI로 새 항목 가공 (기간 검증 포함)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;
    
    // 재시도 로직을 포함한 fetch 함수
    async function fetchWithRetry(url, options, retries = 3, backoff = 2000) {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url, options);
          if (response.ok) return response;
          
          if (response.status === 429) {
            console.log(`사용량 제한(429) 발생. ${backoff}ms 후 다시 시도합니다... (시도 ${i + 1}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            backoff *= 2; // 지수 백오프
            continue;
          }
          
          const errorText = await response.text();
          throw new Error(`API 오류 (${response.status}): ${errorText}`);
        } catch (err) {
          if (i === retries - 1) throw err;
          console.log(`오류 발생: ${err.message}. 다시 시도합니다...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    let successfullyAdded = false;

    for (const targetItem of validNewItems) {

      const prompt = `아래 공공데이터 1건을 분석해서 반드시 JSON 객체 형식으로만 변환해줘. 
오늘 날짜는 ${todayStr}이야. 
**중요: 만약 데이터의 지원 기간(종료일)이 오늘(${todayStr})보다 이전이라면, "expired": true 필드를 추가해줘.**

출력 형식:
{
  "id": 숫자,
  "name": "서비스명",
  "category": "행사" 또는 "혜택",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD 또는 상시",
  "location": "장소 또는 기관명",
  "target": "지원대상",
  "summary": "핵심 내용을 포함한 한줄요약 (50자 내외)",
  "link": "상세정보 확인 가능한 URL",
  "expired": true/false
}

데이터: ${JSON.stringify(targetItem)}`;

      const geminiResponse = await fetchWithRetry(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const geminiResult = await geminiResponse.json();
      if (!geminiResult.candidates || !geminiResult.candidates[0].content || !geminiResult.candidates[0].content.parts[0].text) {
        console.error("Gemini 응답 이상:", JSON.stringify(geminiResult));
        continue;
      }

      let aiText = geminiResult.candidates[0].content.parts[0].text;
      aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
      let newItem;
      try {
        newItem = JSON.parse(aiText);
      } catch(e) {
        console.error("JSON 파싱 오류:", e);
        continue;
      }

      // [4단계] 최종 유효성 검사 및 저장
      if (newItem.expired === true) {
        console.log(`알림: [${newItem.name}] 항목은 지원 기간이 종료되어 제외합니다. 다음 항목 시도.`);
        continue;
      }

      // 고유 ID 부여
      const maxId = db.items.reduce((max, item) => Math.max(max, item.id || 0), 0);
      newItem.id = maxId + 1;
      delete newItem.expired; // 저장할 때는 필드 삭제

      db.items.push(newItem);
      db.lastUpdated = todayStr;

      fs.writeFileSync(dataPath, JSON.stringify(db, null, 2), "utf-8");
      console.log(`성공: [${newItem.name}] 항목이 추가되었습니다.`);
      successfullyAdded = true;
      break; // 성공 시 루프 탈출
    }

    if (!successfullyAdded) {
      console.log("모든 항목 시도 실패: 추가 가능한 유효한 항목이 없습니다.");
    }

  } catch (error) {
    console.error("스크립트 실행 중 오류 발생:", error);
  }
}

fetchPublicData();
