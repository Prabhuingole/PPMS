const fs = require('fs');
const content = fs.readFileSync('e:/sam projects/SPMS/PMS-Frontend/app/superadmin/projects/[id]/page.tsx', 'utf8');

const lines = content.split('\n');
let openDivs = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // replace self-closing divs with empty string so they don't count
  const strippedLine = line.replace(/<div[^>]*\/>/g, '');
  
  const openMatch = strippedLine.match(/<div(\s|>)/g);
  if (openMatch) {
    for (let j = 0; j < openMatch.length; j++) {
      openDivs.push(i + 1);
    }
  }
  
  const closeMatch = strippedLine.match(/<\/div>/g);
  if (closeMatch) {
    for (let j = 0; j < closeMatch.length; j++) {
      openDivs.pop();
    }
  }
}

console.log('Unclosed divs at end of file:');
console.log(openDivs);
