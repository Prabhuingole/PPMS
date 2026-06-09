const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'components');
const appDir = path.join(__dirname, 'app');

const specialTokens = ['bg-white', 'bg-slate-50', 'bg-slate-100', 'text-slate-700'];

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const allFiles = [...walk(srcDir), ...walk(appDir)];

let report = `# SPMS Phase 5.5 - Special Tokens Classification\n\n`;
report += `This report lists occurrences of tokens that require contextual replacement.\n\n`;

const categories = {
  layout: ['layout', 'page', 'sidebar', 'workspace', 'navbar'],
  content: ['card', 'table', 'dialog', 'modal', 'widget', 'panel', 'form', 'settings'],
  typography: ['text-slate-700']
};

let counts = {
  total: 0,
  layout: 0,
  content: 0,
  utility: 0,
  typography: 0
};

let entries = [];

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const filename = path.basename(file).toLowerCase();
  
  lines.forEach((line, index) => {
    specialTokens.forEach(token => {
      // Use regex to find isolated tokens
      const regex = new RegExp(`\\b${token}\\b`);
      if (regex.test(line)) {
        counts.total++;
        let category = 'Utility Surface';
        
        if (token === 'text-slate-700') {
          category = 'Typography';
          counts.typography++;
        } else if (categories.layout.some(l => filename.includes(l))) {
          category = 'Layout Container';
          counts.layout++;
        } else if (categories.content.some(c => filename.includes(c))) {
          category = 'Content Container';
          counts.content++;
        } else {
          counts.utility++;
        }

        const relativePath = file.split('PMS-Frontend')[1].replace(/\\/g, '/');
        entries.push(`- **${category}**: \`${token}\` in [${path.basename(file)}](file:///e:/sam%20projects/SPMS/PMS-Frontend${relativePath}#L${index+1}) \n  > \`${line.trim().substring(0, 80)}\``);
      }
    });
  });
});

report += `## Summary\n`;
report += `- **Total Occurrences:** ${counts.total}\n`;
report += `- **Layout Containers:** ${counts.layout}\n`;
report += `- **Content Containers:** ${counts.content}\n`;
report += `- **Typography:** ${counts.typography}\n`;
report += `- **Utility Surfaces:** ${counts.utility}\n\n`;

report += `## Detailed Occurrences\n\n`;
report += entries.join('\n\n');

fs.writeFileSync('SPMS_SPECIAL_TOKENS_CLASSIFICATION.md', report, 'utf8');
console.log('Classification report generated.');
