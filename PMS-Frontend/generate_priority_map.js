const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const targetDirs = ['app', 'components', 'layouts'];

const patterns = {
  'bg-gradient-to': 'Remaining anti-patterns (bg-gradient-to-*)',
  'font-black': 'Typography violations (font-black)',
  'uppercase tracking-widest': 'Typography violations (uppercase tracking-widest)',
  'shadow-indigo-': 'Legacy styling violations (shadow-indigo-*)',
  'shadow-2xl': 'Legacy styling violations (shadow-2xl)',
  'backdrop-blur': 'Legacy styling violations (backdrop-blur)',
  'rounded-\\[24px\\]': 'Legacy styling violations (rounded-[24px])',
  'text-\\[10px\\]': 'Typography violations (text-[10px])',
  'text-\\[11px\\]': 'Typography violations (text-[11px])',
  'bg-white': 'Dark Mode violations (hardcoded bg-white)',
  'text-black': 'Dark Mode violations (hardcoded text-black)',
  'bg-slate-900': 'Dark Mode violations (hardcoded bg-slate-900)'
};

let fileViolations = {};

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

      let fileViolationCount = 0;

      lines.forEach((line) => {
        for (const pattern of Object.keys(patterns)) {
          const regex = new RegExp(pattern, 'g');
          if (regex.test(line)) {
            fileViolationCount++;
          }
        }
      });

      if (fileViolationCount > 0) {
        const relativePath = fullPath.replace(rootDir + '\\', '').replace(/\\/g, '/');
        fileViolations[relativePath] = fileViolationCount;
      }
    }
  }
}

targetDirs.forEach(dir => scanDirectory(path.join(rootDir, dir)));

function getPriority(filePath) {
  if (filePath.includes('login') || filePath.includes('setup-account') || filePath.includes('reset-password')) return 'P0';
  if (filePath.includes('superadmin/employees') || filePath.includes('employee/profile') || filePath.includes('superadmin/admins') || filePath.includes('superadmin/reporting-managers')) return 'P1';
  if (filePath.includes('projects')) return 'P2';
  if (filePath.includes('attendance') || filePath.includes('timesheets')) return 'P3';
  if (filePath.includes('notes') || filePath.includes('templates')) return 'P4';
  return 'P5';
}

function getMetrics(priority) {
  switch (priority) {
    case 'P0': return { traffic: 'High', critical: 'High', category: 'Login/Auth' };
    case 'P1': return { traffic: 'Low-Medium', critical: 'High', category: 'Employee CRUD' };
    case 'P2': return { traffic: 'Medium', critical: 'High', category: 'Projects' };
    case 'P3': return { traffic: 'High', critical: 'Medium', category: 'Attendance' };
    case 'P4': return { traffic: 'Low', critical: 'Low', category: 'Notes/Templates' };
    default: return { traffic: 'Variable', critical: 'Low', category: 'Cosmetic only' };
  }
}

const fileList = Object.entries(fileViolations).map(([filePath, count]) => {
  const priority = getPriority(filePath);
  const metrics = getMetrics(priority);
  return {
    filePath,
    count,
    priority,
    priorityLevel: parseInt(priority.replace('P', '')),
    ...metrics
  };
});

fileList.sort((a, b) => {
  if (a.priorityLevel !== b.priorityLevel) return a.priorityLevel - b.priorityLevel;
  return b.count - a.count;
});

let markdown = `# SPMS Batch 5 Priority Map\n\n`;
markdown += `This document categorizes all remaining non-compliant files according to business priority and user traffic to dictate the exact order of Batch 5 remediation.\n\n`;

markdown += `## Top 20 Files for Remediation\n\n`;
markdown += `| Rank | File Path | Violations | Priority | Category | Traffic | Criticality |\n`;
markdown += `|------|-----------|------------|----------|----------|---------|-------------|\n`;

fileList.slice(0, 20).forEach((file, index) => {
  markdown += `| ${index + 1} | \`${file.filePath}\` | ${file.count} | **${file.priority}** | ${file.category} | ${file.traffic} | ${file.critical} |\n`;
});

markdown += `\n## All Affected Pages Grouped by Priority\n\n`;

['P0', 'P1', 'P2', 'P3', 'P4', 'P5'].forEach(p => {
  const pFiles = fileList.filter(f => f.priority === p);
  if (pFiles.length > 0) {
    markdown += `### ${p} - ${getMetrics(p).category}\n`;
    pFiles.forEach(file => {
      markdown += `- \`${file.filePath}\`: ${file.count} violations\n`;
    });
    markdown += '\n';
  }
});

fs.writeFileSync(path.join(process.env.APPDATA || 'C:\\Users\\HP\\AppData\\Roaming', '..', '..', '.gemini', 'antigravity-ide', 'brain', '52157ac7-97c4-44f6-b6a3-a86d78e5b41e', 'SPMS_BATCH5_PRIORITY_MAP.md'), markdown);
console.log('Priority map generated.');
