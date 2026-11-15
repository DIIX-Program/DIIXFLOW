const fs = require('fs');
const content = fs.readFileSync('n8n/packages/workflow/src/interfaces.ts', 'utf-8');

function extractInterface(name) {
  const re = new RegExp(`export interface ${name}\\b[^{]*\\{([\\s\\S]*?)\\n\\}`, 'm');
  const m = content.match(re);
  if (m) {
    console.log(`=== INTERFACE: ${name} ===`);
    console.log(m[0].slice(0, 1000));
  }
}

extractInterface('INode');
extractInterface('INodeType');
extractInterface('INodeParameters');
extractInterface('IConnections');
