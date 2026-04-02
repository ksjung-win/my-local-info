const fs = require('fs');
const path = require('path');

async function fetchPublicData() {
  try {
    const PUBLIC_DATA_API_KEY = process.env.PUBLIC_DATA_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!PUBLIC_DATA_API_KEY || !GEMINI_API_KEY) {
      console.error("환경 변수(PUBLIC_DATA_API_KEY, GEMINI_API_KEY)가 설정되어 있지 않습�    // [1단계] 공공데이터포털 API에서 데이터 가져오기 (여러 페이지 검색)
    const baseUrl = "https://api.odcloud.kr/api/gov24/v3/serviceList";
    const maxPages = 5;
    let rawData = [];
    
    console.log("공공데이터 API에서 최신 정보를 수집합니다. (최대 5페이지 검색)");
    
    for (let page = 1; page <= maxPages; page++) {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        perPage: "100",
        returnType: "JSON",
        serviceKey: PUBLIC_DATA_API_KEY
      });

      const response = await fetch(`${baseUrl}?${queryParams.toString()}`);
      if (!response.ok) {
        console.error(`API 호출 실패 (Page ${page}): ${response.status}`);
        continue;
      }
      
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        rawData = rawData.concat(result.data);
        console.log(`Page ${page} 수집 완료: 총 ${rawData.length}개 항목 확보`);
      } else {
        break;
      }
    }

    if (rawData.length === 0) {
      console.error("데이터를 불러오지 못했거나 데이터 형식이 올바르지 않습니다.");
      return;
    }

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
    
    // [2단계] 기존 데이터와 비교
    const dataPath = path.join(process.cwd(), "public", "data", "local-info.json");
    if (!fs.existsSync(dataPath)) {
      console.error("데이터 파일(local-info.json)이 존재하지 않습니다. 초기 파일을 생성합니다.");
      fs.writeFileSync(dataPath, JSON.stringify({ lastUpdated: "2026-04-02", source: "초기화", items: [] }, null, 2), "utf-8");
    }
    
    const existingFile = fs.readFileSync(dataPath, "utf-8");
    let db;
    try {
      db = JSON.parse(existingFile);
      if (!db.items) db.items = [];
    } catch (e) {
      console.error("JSON 파싱 오류! 백업 파일에서 복구를 시도합니다.");
      const backupPath = dataPath + ".bak";
      if (fs.existsSync(backupPath)) {
        db = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
      } else {
        throw new Error("데이터 파일이 손상되었고 백업도 없습니다.");
      }
    }
    
    const existingNames = new Set(db.items.map(item => item.서비스명 || item.name));
    let newItems = filtered.filter(item => !existingNames.has(item.서비스명));

    if (newItems.length === 0) {
      console.log("필터링된 항목 중 새로운 데이터가 없습니다. 전체 데이터에서 새로운 항목을 찾습니다.");
      newItems = rawData.filter(item => !existingNames.has(item.서비스명));
      
      if (newItems.length === 0) {
        console.log("완전히 새로운 데이터가 없습니다. 기존 항목 중 무작위로 하나를 선택하여 리프레시합니다.");
        // 폴백: 기존 항목 중 하나 무작위 선택
        const randomIndex = Math.floor(Math.random() * rawData.length);
        newItems = [rawData[randomIndex]];
      }
    }

    // 새 항목 중 하나 선택 (가급적 첫 번째 새로운 것)
    const targetItem = newItems[0];
    console.log(`대상 항목 선정: ${targetItem.서비스명}`);

    // [3단계] Gemini AI로 새 항목 가공
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
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
      console.error("Gemini API로부터 올바른 응답을 받지 못했습니다.");
      return;
    }

    let aiText = geminiResult.candidates[0].content.parts[0].text;
    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    const newItem = JSON.parse(aiText);

    // 고유 ID 부여
    const maxId = db.items.reduce((max, item) => Math.max(max, item.id || 0), 0);
    newItem.id = maxId + 1;

    // [4단계] 기존 데이터에 추가
    db.items.push(newItem);
    db.lastUpdated = today;

    // 백업 생성 후 저장
    fs.copyFileSync(dataPath, dataPath + ".bak");
    fs.writeFileSync(dataPath, JSON.stringify(db, null, 2), "utf-8");
    console.log(`성공: [${newItem.name}] 항목이 추가되었습니다.`);
;
    
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

    // 백업 생성 후 저장
    fs.copyFileSync(dataPath, dataPath + ".bak");
    fs.writeFileSync(dataPath, JSON.stringify(db, null, 2), "utf-8");
    console.log(`성공: [${newItem.name}] 항목이 추가되었습니다. (백업 완료)`);

  } catch (error) {
    console.error("스크립트 실행 중 오류 발생:", error);
    // 에러 발생 시 기존 파일을 유지하므로 추가 조치 없음
  }
}

fetchPublicData();
