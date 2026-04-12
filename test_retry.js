async function fetchWithRetry(retries = 3, backoff = 100) {
  for (let i = 0; i < retries; i++) {
    try {
      // Simulate 429 response
      const response = { ok: false, status: 429, text: async () => 'error' };
      if (response.ok) return response;
      if (response.status === 429) {
        if (i === retries - 1) throw new Error("사용량 제한(429)이 반복되어 작업을 중단합니다.");
        console.log(`사용량 제한(429) 발생. ${backoff}ms 후 다시 시도합니다... (시도 ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        backoff *= 2; 
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

async function run() {
    try {
        const res = await fetchWithRetry();
        console.log("res is:", res);
        res.json();
    } catch (e) {
        console.error("Caught in main:", e.message);
    }
}
run();
