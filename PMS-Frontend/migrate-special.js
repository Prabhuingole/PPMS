const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'components');
const appDir = path.join(__dirname, 'app');

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

const categories = {
  layout: ['layout', 'page', 'sidebar', 'workspace', 'navbar'],
  content: ['card', 'table', 'dialog', 'modal', 'widget', 'panel', 'form', 'settings']
};

let filesModifiedCount = 0;

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  const filename = path.basename(file).toLowerCase();
  
  let isLayout = categories.layout.some(l => filename.includes(l));
  let isContent = categories.content.some(c => filename.includes(c));
  
  if (!isLayout && !isContent) {
    isContent = true; // default utility to content
  }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Status Badge fix
    if (filename === 'status-badge.tsx' || filename === 'statusbadge.tsx') {
      line = line.replace(/bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200\/50/g, 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-500/30');
      line = line.replace(/bg-amber-50 text-amber-600 ring-1 ring-amber-200\/50/g, 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-500/30');
      line = line.replace(/bg-red-50 text-red-600 ring-1 ring-red-200\/50/g, 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:ring-red-500/30');
      line = line.replace(/bg-blue-50 text-blue-600 ring-1 ring-blue-200\/50/g, 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-500/30');
      line = line.replace(/bg-purple-50 text-purple-600 ring-1 ring-purple-200\/50/g, 'bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:ring-purple-500/30');
      line = line.replace(/bg-cyan-50 text-cyan-600 ring-1 ring-cyan-200\/50/g, 'bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-400 dark:ring-cyan-500/30');
      line = line.replace(/bg-slate-50 text-slate-600 ring-1 ring-slate-200\/50/g, 'bg-muted text-muted-foreground ring-1 ring-border');
      
      // For StatusBadge.tsx
      line = line.replace(/bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200\/50/g, 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30');
      line = line.replace(/bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200\/50/g, 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30');
      line = line.replace(/bg-red-50 text-red-600 hover:bg-red-100 border-red-200\/50/g, 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30');
      line = line.replace(/bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200\/50/g, 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/30');
      line = line.replace(/bg-slate-50 text-slate-600 hover:bg-slate-100 border-border\/50/g, 'bg-muted text-muted-foreground hover:bg-muted/80 border-border');
    }

    // bg-white
    // Replace bg-white, but avoid bg-white/10, bg-white/20, bg-white/60, bg-white/[0.03], etc.
    line = line.replace(/(?<!-)bg-white(?!\/)/g, isLayout ? 'bg-background' : 'bg-card');

    // bg-slate-50
    line = line.replace(/hover:bg-slate-50(?!\/)/g, 'hover:bg-muted');
    line = line.replace(/(?<!hover:)bg-slate-50(?!\/)/g, isLayout ? 'bg-muted/30' : 'bg-muted');

    // bg-slate-100
    line = line.replace(/hover:bg-slate-100(?!\/)/g, 'hover:bg-muted');
    line = line.replace(/(?<!hover:)bg-slate-100(?!\/)/g, 'bg-muted');

    // text-slate-700
    if (line.includes('text-slate-700')) {
      if (line.includes('font-bold') || line.includes('font-black') || line.includes('font-semibold')) {
        line = line.replace(/text-slate-700/g, 'text-foreground');
      } else {
        line = line.replace(/text-slate-700/g, 'text-muted-foreground');
      }
    }

    lines[i] = line;
  }
  
  content = lines.join('\n');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    filesModifiedCount++;
  }
});

console.log(`Phase 5.5 Contextual Replacement Complete`);
console.log(`Files modified: ${filesModifiedCount}`);
