const fs = require('fs');
const s = fs.readFileSync('docs/reference-analysis/gustra-index.js', 'utf-8');
const match = s.match(/\["assets\/[^\]]+\]/);
if (match) {
  const assets = JSON.parse(match[0]);
  console.log('Total assets in Gustra:', assets.length);
  console.log('Assets list:', assets);
}
