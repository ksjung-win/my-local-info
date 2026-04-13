const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), "public", "data", "local-info.json");
const db = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
const todayKst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
const todayStr = todayKst.toISOString().split("T")[0];

const postsDir = path.join(process.cwd(), "src", "content", "posts");
const existingFiles = fs.readdirSync(postsDir);
let targetItem = null;

for (let i = db.items.length - 1; i >= 0; i--) {
  const item = db.items[i];
  if (item.endDate && item.endDate !== "상시") {
    if (item.endDate < todayStr) continue;
  }
  const isAlreadyWritten = existingFiles.some(file => {
    if (!file.endsWith(".md")) return false;
    const content = fs.readFileSync(path.join(postsDir, file), "utf-8");
    return content.includes(item.name);
  });
  if (!isAlreadyWritten) {
    targetItem = item;
    break;
  }
}

console.log("targetItem:", targetItem ? targetItem.name : "null");
