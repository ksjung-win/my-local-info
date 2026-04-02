const fs = require('fs');
const path = require('path');
const isUtf8 = require('is-utf8');

const postsDir = path.join(__dirname, 'src/content/posts');
const files = fs.readdirSync(postsDir);

files.forEach(file => {
    if (file.endsWith('.md')) {
        const filePath = path.join(postsDir, file);
        const buffer = fs.readFileSync(filePath);
        const utf8 = isUtf8(buffer);
        console.log(`${file}: ${utf8 ? 'UTF-8' : 'NOT UTF-8'}`);
        if (!utf8) {
            // Check for BOM or UTF-16
            if (buffer[0] === 0xff && buffer[1] === 0xfe) {
                console.log(`  -> Likely UTF-16LE`);
            } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
                console.log(`  -> Likely UTF-16BE`);
            }
        }
    }
});
