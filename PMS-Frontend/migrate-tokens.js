const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'components');
const appDir = path.join(__dirname, 'app');
const libDir = path.join(__dirname, 'lib');

const safeReplacements = [
  { search: /\bbg-indigo-600\b/g, replace: 'bg-primary' },
  { search: /\btext-slate-900\b/g, replace: 'text-foreground' },
  { search: /\btext-slate-500\b/g, replace: 'text-muted-foreground' },
  { search: /\btext-slate-400\b/g, replace: 'text-muted-foreground' },
  { search: /\btext-indigo-600\b/g, replace: 'text-primary' },
  { search: /\bborder-slate-200\b/g, replace: 'border-border' },
  { search: /\bborder-slate-100\b/g, replace: 'border-border' },
  { search: /\bfocus-visible:ring-indigo-500\b/g, replace: 'focus-visible:ring-ring' },
  { search: /\bfocus-visible:ring-emerald-500\b/g, replace: 'focus-visible:ring-ring' },
  { search: /\bfocus-visible:ring-amber-500\b/g, replace: 'focus-visible:ring-ring' },
  { search: /\bfocus-visible:ring-indigo-600\b/g, replace: 'focus-visible:ring-ring' },
  { search: /\brounded-2xl\b/g, replace: 'rounded-xl' },
  { search: /\brounded-3xl\b/g, replace: 'rounded-xl' }
];

let filesModifiedCount = 0;
let totalReplacementsCount = 0;

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

const allFiles = [...walk(srcDir), ...walk(appDir), ...walk(libDir)];

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let modificationsInFile = 0;

  safeReplacements.forEach(({ search, replace }) => {
    const matches = content.match(search);
    if (matches) {
      modificationsInFile += matches.length;
      totalReplacementsCount += matches.length;
      content = content.replace(search, replace);
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    filesModifiedCount++;
  }
});

console.log(`Phase 5.5 Auto-Replacement Complete`);
console.log(`Total files scanned: ${allFiles.length}`);
console.log(`Files modified: ${filesModifiedCount}`);
console.log(`Total tokens replaced: ${totalReplacementsCount}`);
