const fs = require('fs');
const path = require('path');

const dataPath = 'c:/Users/정교선/OneDrive/Desktop/al-local-info/public/data/local-info.json';
const db = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
console.log('Total items:', db.items.length);
const lastItem = db.items[db.items.length - 1];
console.log('Last item:', JSON.stringify(lastItem, null, 2));

const postsDir = 'c:/Users/정교선/OneDrive/Desktop/al-local-info/src/content/posts';
const existingFiles = fs.readdirSync(postsDir);
const isAlreadyWritten = existingFiles.some(file => {
    if (!file.endsWith(".md")) return false;
    const content = fs.readFileSync(path.join(postsDir, file), "utf-8");
    return content.includes(lastItem.name);
});
console.log('Is already written:', isAlreadyWritten);
