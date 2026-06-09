const fs = require('fs');
const path = require('path');

const srcDirs = [path.join(__dirname, 'components'), path.join(__dirname, 'app'), path.join(__dirname, 'lib')];

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const allFiles = srcDirs.flatMap(d => walk(d));

const searchTerms = [
  'text-white', 'text-black', 'bg-black', 'border-white', 'border-black',
  'fill-white', 'fill-black', 'stroke-white', 'stroke-black',
  'from-white', 'to-white', 'via-white', 'from-black', 'to-black', 'via-black',
  '#ffffff', '#000000', 'rgb(', 'rgba('
];

// Regex for complete word match to avoid matching 'bg-black/50' if not needed? 
// The user just said "search entire frontend for ...".
let auditMd = '# SPMS Dark Mode Blocker Audit\n\n';
auditMd += 'This report identifies potential blockers for dark mode implementation.\n\n';

let totalIssues = 0;
let fileIssues = {};

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(__dirname, file).replace(/\\/g, '/');

  let matchesInFile = [];

  lines.forEach((line, index) => {
    searchTerms.forEach(term => {
      if (line.includes(term)) {
        // Exclude some false positives like SVG fills or comments, but let's keep it broad as requested
        matchesInFile.push({ line: index + 1, term: term, content: line.trim() });
        totalIssues++;
      }
    });
  });

  if (matchesInFile.length > 0) {
    fileIssues[relativePath] = matchesInFile;
  }
});

auditMd += `## Summary\n\n- **Total Potential Blockers:** ${totalIssues}\n\n`;
auditMd += `## Detailed Findings\n\n`;

for (const [file, matches] of Object.entries(fileIssues)) {
  auditMd += `### \`${file}\`\n`;
  matches.forEach(m => {
    auditMd += `- **Line ${m.line}** (\`${m.term}\`): \`${m.content}\`\n`;
  });
  auditMd += '\n';
}

fs.writeFileSync(path.join(__dirname, 'SPMS_DARK_MODE_BLOCKER_AUDIT.md'), auditMd);
console.log(`Scan complete. Found ${totalIssues} potential blockers.`);
