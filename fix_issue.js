const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, 'scripts/generate-blog-post.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Replace title: ${...} with title: "${...}" but handle existing quotes
// We look for title: followed by ${...} and check if it's already quoted
// This regex covers: title: ${...} or title: 123
scriptContent = scriptContent.replace(/title: (\${[^}]+})/g, (match, p1) => {
    return `title: "${p1}"`;
});

fs.writeFileSync(scriptPath, scriptContent);
console.log('Fixed scripts/generate-blog-post.js');

// Also fix existing posts if needed
const postsDir = path.join(__dirname, 'src/content/posts');
const files = fs.readdirSync(postsDir);

files.forEach(file => {
    if (file.endsWith('.md')) {
        const filePath = path.join(postsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find line starting with title: and not already quoted
        // but containing a colon (:) in the value
        let modified = false;
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('title: ') && !line.startsWith('title: "') && line.includes(':')) {
                const titleValue = line.substring(7);
                lines[i] = `title: "${titleValue.replace(/"/g, '\\"')}"`;
                modified = true;
            }
        }
        
        if (modified) {
            fs.writeFileSync(filePath, lines.join('\n'));
            console.log(`Fixed ${file}`);
        }
    }
});
