const fs = require('fs');
const path = require('path');

const postsDirectory = path.join(process.cwd(), 'src/content/posts');
const fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith('.md'));

const festivals = [
  { id: 1, name: "성남시 봄꽃 축제" },
  { id: 2, name: "판교 청년 창업 박람회" },
  { id: 3, name: "성남시 어린이날 큰잔치" }
];

console.log("--- RAW SEARCH TEST ---");
festivals.forEach(item => {
  const keywords = item.name.split(/\s+/).filter(w => w.length > 1);
  let found = false;
  
  for (const fileName of fileNames) {
    const content = fs.readFileSync(path.join(postsDirectory, fileName), 'utf8');
    const matchCount = keywords.filter(kw => content.toLowerCase().includes(kw.toLowerCase())).length;
    
    if (matchCount >= Math.max(1, Math.ceil(keywords.length * 0.7))) {
      console.log(`SUCCESS: ${item.name} -> Matched in ${fileName} (Matches: ${matchCount}/${keywords.length})`);
      found = true;
      break;
    }
  }
  if (!found) console.log(`FAILURE: ${item.name} -> No match found!`);
});
