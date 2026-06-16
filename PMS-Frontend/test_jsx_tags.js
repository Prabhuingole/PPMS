const fs = require('fs');
const content = fs.readFileSync('e:/sam projects/SPMS/PMS-Frontend/app/superadmin/projects/ProjectFormModal.tsx', 'utf8');

let strippedContent = content
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '')

const tags = ['div', 'span', 'p', 'Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogFooter', 'Button', 'Input', 'Label', 'Select', 'Textarea', 'Badge', 'Form', 'FormField', 'FormItem', 'FormLabel', 'FormControl', 'FormMessage', 'ScrollArea'];

for (const tag of tags) {
  const openTags = strippedContent.match(new RegExp(`<${tag}(?=\\s|>)`, 'g')) || [];
  const closeTags = strippedContent.match(new RegExp(`</${tag}>`, 'g')) || [];
  const selfClosing = strippedContent.match(new RegExp(`<${tag}[^>]*/>`, 'g')) || [];
  
  const openCountReal = openTags.length - selfClosing.length;
  
  if (openCountReal !== closeTags.length) {
    console.log(`Mismatch in ${tag}: open=${openCountReal}, close=${closeTags.length}`);
  }
}
