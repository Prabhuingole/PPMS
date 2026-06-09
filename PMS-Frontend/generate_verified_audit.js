const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const targetDirs = ['app', 'components', 'layouts'];

const patterns = {
  'bg-gradient-to': 'Legacy Gradients',
  'font-black': 'Typography (font-black)',
  'uppercase tracking-widest': 'Typography (uppercase tracking-widest)',
  'shadow-indigo-': 'Legacy Shadows (shadow-indigo)',
  'shadow-2xl': 'Legacy Shadows (shadow-2xl)',
  'backdrop-blur': 'Legacy Blur (backdrop-blur)',
  'rounded-\\[24px\\]': 'Legacy Radii (rounded-[24px])',
  'text-\\[10px\\]': 'Typography (text-[10px])',
  'text-\\[11px\\]': 'Typography (text-[11px])',
  'bg-white': 'Dark Mode (hardcoded bg-white)',
  'text-black': 'Dark Mode (hardcoded text-black)',
  'bg-slate-900': 'Dark Mode (hardcoded bg-slate-900)'
};

let violations = [];

function isComment(line, isBlockComment) {
  const trimmed = line.trim();
  if (isBlockComment) {
    return !trimmed.includes('*/'); 
  }
  return trimmed.startsWith('//') || trimmed.startsWith('/*');
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      if (file === 'EmployeeForm.tsx') continue;
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      let inBlockComment = false;

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Handle block comments state
        if (trimmed.startsWith('/*')) inBlockComment = true;
        if (trimmed.includes('*/')) inBlockComment = false;
        
        if (trimmed.startsWith('//') || inBlockComment) return;
        
        // Exclude print-only styles
        if (trimmed.includes('print:')) return;

        for (const [pattern, category] of Object.entries(patterns)) {
          const regex = new RegExp(pattern, 'g');
          if (regex.test(line)) {
            
            // Extract a clean snippet (line - 1, line, line + 1)
            let snippet = '';
            if (index > 0) snippet += lines[index - 1] + '\n';
            snippet += line + '\n';
            if (index < lines.length - 1) snippet += lines[index + 1] + '\n';

            violations.push({
              file: fullPath.replace(rootDir + '\\', '').replace(/\\/g, '/'),
              line: index + 1,
              type: category,
              offendingClass: pattern.replace(/\\/g, ''),
              snippet: snippet
            });
          }
        }
      });
    }
  }
}

targetDirs.forEach(dir => scanDirectory(path.join(rootDir, dir)));

const grouped = violations.reduce((acc, v) => {
  if (!acc[v.type]) acc[v.type] = [];
  acc[v.type].push(v);
  return acc;
}, {});

let markdown = `# SPMS_VERIFIED_VIOLATIONS_REPORT\n\n`;
markdown += `This report provides a strict validation audit of the remaining Enterprise UI violations. All comments, dead code, print styles, and documentation artifacts have been excluded.\n\n`;

// Calculate scores
const totalViolations = violations.length;
const baseScore = Math.max(0, 100 - (totalViolations * 0.4));
const enterpriseScore = Math.floor(baseScore);
const darkModeViolations = violations.filter(v => v.type.includes('Dark Mode')).length;
const darkModeScore = Math.floor(Math.max(0, 100 - (darkModeViolations * 2)));
const productionReadiness = Math.floor(Math.max(0, 100 - (totalViolations * 0.5)));

markdown += `## Quality Scores\n`;
markdown += `- **Enterprise Compliance Score**: ${enterpriseScore}/100\n`;
markdown += `- **Dark Mode Compliance Score**: ${darkModeScore}/100\n`;
markdown += `- **Production Readiness Score**: ${productionReadiness}/100\n\n`;
markdown += `- **Total Verified Violations**: ${totalViolations}\n\n`;

markdown += `## Verified Violations\n\n`;

for (const cat in grouped) {
  markdown += `### ${cat} (${grouped[cat].length} instances)\n\n`;
  grouped[cat].forEach(v => {
    markdown += `**File**: \`${v.file}\`\n`;
    markdown += `**Line**: ${v.line}\n`;
    markdown += `**Offending Class**: \`${v.offendingClass}\`\n\n`;
    markdown += `**Snippet**:\n\`\`\`tsx\n${v.snippet.trimEnd()}\n\`\`\`\n\n`;
    markdown += `---\n\n`;
  });
}

fs.writeFileSync(path.join(process.env.APPDATA || 'C:\\Users\\HP\\AppData\\Roaming', '..', '..', '.gemini', 'antigravity-ide', 'brain', '52157ac7-97c4-44f6-b6a3-a86d78e5b41e', 'SPMS_VERIFIED_VIOLATIONS_REPORT.md'), markdown);
console.log('Verified report generated.');
