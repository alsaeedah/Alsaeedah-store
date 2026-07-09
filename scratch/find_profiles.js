const fs = require('fs');
const path = require('path');

function scanDir(dir, searchStr) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                scanDir(fullPath, searchStr);
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.sql') || file.endsWith('.json')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.toLowerCase().includes(searchStr.toLowerCase())) {
                    console.log(`Found in: ${fullPath}`);
                }
            }
        }
    }
}

console.log("Searching for 'profiles'...");
scanDir(path.resolve(__dirname, '..'), 'profiles');
console.log("Done.");
