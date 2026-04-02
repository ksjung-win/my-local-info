const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDir = path.join(__dirname, 'src/content/posts');
const files = fs.readdirSync(postsDir);

files.forEach(file => {
    if (file.endsWith('.md')) {
        const filePath = path.join(postsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        try {
            matter(content);
            console.log(`✅ ${file}: OK`);
        } catch (e) {
            console.error(`❌ ${file}: ERROR`);
            console.error(e.message);
        }
    }
});
