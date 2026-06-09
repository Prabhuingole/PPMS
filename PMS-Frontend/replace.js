const fs = require('fs');

const files = [
  'e:/sam projects/SPMS/PMS-Frontend/app/superadmin/employees/[id]/page.tsx',
  'e:/sam projects/SPMS/PMS-Frontend/app/employee/profile/page.tsx',
  'e:/sam projects/SPMS/PMS-Frontend/app/superadmin/reporting-managers/[id]/page.tsx',
  'e:/sam projects/SPMS/PMS-Frontend/app/superadmin/employees/page.tsx',
  'e:/sam projects/SPMS/PMS-Frontend/app/superadmin/admins/page.tsx',
  'e:/sam projects/SPMS/PMS-Frontend/app/superadmin/reporting-managers/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`Skipping missing file: ${file}`);
    return;
  }
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace font-black -> font-bold
  content = content.replace(/font-black/g, 'font-bold');
  
  // Replace text-[10px] and text-[11px] -> text-xs
  content = content.replace(/text-\[10px\]/g, 'text-xs');
  content = content.replace(/text-\[11px\]/g, 'text-xs');
  
  // Replace specific combinations to prevent weird class names
  content = content.replace(/uppercase tracking-widest/g, 'tracking-wider');
  content = content.replace(/tracking-widest uppercase/g, 'tracking-wider');
  content = content.replace(/text-xs font-bold uppercase tracking-wider text-muted-foreground/g, 'text-sm font-medium text-muted-foreground');
  content = content.replace(/tracking-widest/g, 'tracking-wider');
  
  // Just strip leftover uppercase 
  content = content.replace(/\buppercase\b/g, '');
  
  // Fix double spaces inside class names caused by removing 'uppercase'
  content = content.replace(/class(?:Name)?="([^"]+)"/g, (match, classes) => {
    return 'className="' + classes.replace(/\s+/g, ' ').trim() + '"';
  });

  fs.writeFileSync(file, content);
  console.log(`Processed ${file}`);
});
console.log('Replaced P1 typography');
