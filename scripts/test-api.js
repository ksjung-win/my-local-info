const fs = require('fs');
const path = require('path');

async function testFetch() {
  const PUBLIC_DATA_API_KEY = process.env.PUBLIC_DATA_API_KEY;
  const baseUrl = "https://api.odcloud.kr/api/gov24/v3/serviceList";
  const maxPages = 5;
  let allFiltered = [];
  
  for (let page = 1; page <= maxPages; page++) {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      perPage: "100",
      returnType: "JSON",
      serviceKey: PUBLIC_DATA_API_KEY
    });

    console.log(`Fetching Page ${page} from:`, `${baseUrl}?${queryParams.toString()}`);
    const response = await fetch(`${baseUrl}?${queryParams.toString()}`);
    const result = await response.json();
    
    if (result.data) {
      console.log(`Page ${page}: Total items returned: ${result.data.length}`);
      
      const seongnamKeywords = ["성남", "분당", "판교", "수정구", "중원구"];
      let filtered = result.data.filter(item => {
        const fields = [item.서비스명, item.서비스목적요약, item.지원대상, item.소관기관명];
        return seongnamKeywords.some(keyword => 
          fields.some(field => field && field.includes(keyword))
        );
      });
      console.log(`Page ${page}: Filtered items (Seongnam): ${filtered.length}`);
      
      if (filtered.length === 0) {
        const gyeonggiKeywords = ["경기"];
        filtered = result.data.filter(item => {
          const fields = [item.서비스명, item.서비스목적요약, item.지원대상, item.소관기관명];
          return gyeonggiKeywords.some(keyword => 
            fields.some(field => field && field.includes(keyword))
          );
        });
        console.log(`Page ${page}: Filtered items (Gyeonggi): ${filtered.length}`);
      }
      
      allFiltered = allFiltered.concat(filtered);
      if (allFiltered.length > 0) {
        // console.log("Found some items, continuing to next page to see more...");
      }
    } else {
      console.log(`Page ${page}: No data returned.`);
      break;
    }
  }
  
  console.log("Total Filtered Items across 5 pages:", allFiltered.length);
  allFiltered.forEach(item => console.log("- ", item.서비스명));
}

testFetch();
