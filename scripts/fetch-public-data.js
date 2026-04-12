const fs = require('fs');
const path = require('path');
try {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  });
} catch (e) {}

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
    const todayYMD = todayStr.replace(/-/g, '');

    // 기존 데이터 읽기
    const dataPath = path.join(process.cwd(), "public", "data", "local-info.json");
    const existingFile = fs.readFileSync(dataPath, "utf-8");
    const db = JSON.parse(existingFile);
    const existingNames = new Set(db.items.map(item => item.name));

    let rawData = [];
    let validNewItems = [];
    const maxRetries = 15;
    let successfullyAdded = false;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    async function fetchWithRetry(url, options, retries = 8, backoff = 10000) {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url, options);
          if (response.ok) return response;
          
          if (response.status === 429) {
            console.log(`사용량 제한(429) 발생. ${backoff}ms 대기 후 재시도 (${i + 1}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            backoff *= 2; 
            continue;
          }
          const errorText = await response.text();
          throw new Error(`API Error ${response.status}: ${errorText}`);
        } catch (err) {
          if (i === retries - 1) throw err;
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    // [1] 데이터 추출 (보조금24 + 한국관광공사 TourAPI 하이브리드)
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const fetchType = Math.random() < 0.4 ? 'tour' : 'gov24'; 
      
      console.log(`API 조회 중... (시도: ${attempt}/${maxRetries}, 타입: ${fetchType})`);
      
      try {
        if (fetchType === 'tour') {
          const randomPage = Math.floor(Math.random() * 5) + 1;
          const tourUrl = `http://apis.data.go.kr/B551011/KorService1/searchFestival1?serviceKey=${PUBLIC_DATA_API_KEY}&numOfRows=50&pageNo=${randomPage}&MobileOS=ETC&MobileApp=LocalInfo&_type=json&eventStartDate=${todayYMD}`;
          
          const response = await fetch(tourUrl);
          const text = await response.text();
          const result = JSON.parse(text);
          
          const items = result?.response?.body?.items?.item || [];
          rawData = Array.isArray(items) ? items : [items];
          
        } else {
          const randomPage = Math.floor(Math.random() * 50) + 1;
          const govUrl = `https://api.odcloud.kr/api/gov24/v3/serviceList?page=${randomPage}&perPage=50&returnType=JSON&serviceKey=${PUBLIC_DATA_API_KEY}`;
          
          const response = await fetch(govUrl);
          const result = await response.json();
          const items = result.data || [];
          
          const keywords = ["청년", "신혼부부", "소상공인", "지원금", "수당", "바우처", "임산부", "아동", "전국", "장려금"];
          rawData = items.filter(item => {
            const str = JSON.stringify(item);
            return keywords.some(k => str.includes(k));
          });
        }
      } catch (err) {
        console.error(`데이터 조회 파싱 실패 (${fetchType}):`, err.message);
        continue;
      }

      validNewItems = rawData.filter(item => {
        const name = item.서비스명 || item.title || item.name;
        return name && !existingNames.has(name);
      });

      if (validNewItems.length === 0) {
        console.log("현재 페이지에 추가할 수 있는 새 데이터가 없습니다. 다음 페이지 시도.");
        continue;
      }

      // [2] Gemini AI 큐레이션 및 포맷 변환
      for (const targetItem of validNewItems) {
        const prompt = `아래 공공데이터 1건(보조금 또는 축제/관광 데이터)을 분석해서 반드시 JSON 객체 형식으로만 변환해줘. 
오늘 날짜는 ${todayStr}이야. 

[가장 중요한 큐레이션 미션]
이 데이터가 대한민국 국민(청년, 소상공인, 가족 등)에게 얼마나 '실질적인 혜택'이 되거나 '인기 있는 축제'인지 매력도를 0~100점으로 평가해.
만약 너무 전문적이거나(예: 어선 장비 지원, 특정 농기계), 대상이 극소수이거나, 이미 기간이 지났다면 점수를 70점 미만으로 낮춰. 
점수가 70점 미만이거나 기간이 지났다면 "expired": true 필드를 추가해. 70점 이상이면 "expired": false 가 되어야 해.

출력 형식:
{
  "id": 0,
  "name": "서비스명 또는 축제명",
  "category": "혜택", // 축제나 여행, 행사 정보면 "축제" 또는 "행사"로 지정
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD 또는 상시",
  "location": "관할 기관 또는 축제 장소(예: 전국, 혹은 구체적 장소)",
  "target": "누가 받을 수 있는지 / 참가할 수 있는지 (예: 청년, 소상공인, 전국민)",
  "summary": "방문자를 위한 아주 구체적이고 매력적인 1줄 요약 (50자 내외)",
  "link": "상세정보 확인 가능한 공식 URL (없으면 '#')",
  "expired": true 혹은 false
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
        if (!geminiResult.candidates || !geminiResult.candidates[0].content) {
          console.error("Gemini 응답 이슈, 다음 항목 시도.");
          continue;
        }

        let aiText = geminiResult.candidates[0].content.parts[0].text;
        aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
        let newItem;
        try {
          newItem = JSON.parse(aiText);
        } catch(e) {
          console.error("JSON 파싱 오류. 스킵.");
          continue;
        }

        if (newItem.expired === true) {
          console.log(`알림: [${newItem.name || '알 수 없음'}] - AI 평가 70점 미만 또는 기한 만료. 제외됨.`);
          continue;
        }

        const maxId = db.items.reduce((max, item) => Math.max(max, item.id || 0), 0);
        newItem.id = maxId + 1;
        delete newItem.expired; 

        db.items.push(newItem);
        db.lastUpdated = todayStr;

        fs.writeFileSync(dataPath, JSON.stringify(db, null, 2), "utf-8");
        console.log(`✨ 성공: [${newItem.name}] - 고품질 항목 데이터베이스 추가 완료.`);
        successfullyAdded = true;
        break; // inner gemini loop
      }

      if (successfullyAdded) {
        break; // attempt loop
      } else {
        console.log("이번 페이지의 아이템들이 모두 AI 평가를 통과하지 못했습니다. 다음 페이지를 계속 시도합니다.");
      }
    }

    if (!successfullyAdded) {
      console.log("모든 항목 검증 실패 (또는 새 데이터 없음/모두 AI 커트라인 미달). 업데이트 없음.");
    }

  } catch (error) {
    console.error("스크립트 실행 중 치명적 오류:", error);
  }
}

fetchPublicData();
