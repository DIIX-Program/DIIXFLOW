const fs = require('fs');
const css = fs.readFileSync('docs/reference-analysis/gustra-bundle.css', 'utf-8');

function findRules(keyword) {
  const re = new RegExp(`([^}{]+${keyword}[^}{]*\\{[^}]+\\})`, 'gi');
  const matches = css.match(re) || [];
  return matches.slice(0, 5);
}

console.log('--- BUTTONS ---');
console.log(findRules('btn').join('\n\n'));

console.log('--- CARDS ---');
console.log(findRules('card').join('\n\n'));

console.log('--- SIDEBAR ---');
console.log(findRules('side').join('\n\n'));

console.log('--- BADGE / CHIP ---');
console.log(findRules('badge|chip').join('\n\n'));

console.log('--- TABLE ---');
console.log(findRules('table').join('\n\n'));
