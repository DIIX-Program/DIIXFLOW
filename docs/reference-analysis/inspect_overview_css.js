const fs = require('fs');
const css = fs.readFileSync('docs/reference-analysis/gustra-overview.css', 'utf-8');
console.log('Overview CSS length:', css.length);
// Extract class names
const classes = [...css.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
console.log('Classes sample:', [...new Set(classes)].slice(0, 40));
