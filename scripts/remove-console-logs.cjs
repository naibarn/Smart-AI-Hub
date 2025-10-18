const fs = require('fs');
const path = require('path');

const filesWithConsoleLogs = [
  'packages/agent-service/src/services/CloudflareR2Service.ts',
  'packages/agent-service/src/services/CloudflareVectorizeService.ts',
  'packages/agent-service/src/services/DocumentProcessorService.ts',
  'packages/agent-service/src/services/PricingService.ts',
  'packages/agent-service/src/services/SkillsService.ts',
  'packages/core-service/src/services/credit-reservation.service.ts'
];

filesWithConsoleLogs.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove console.log statements
    content = content.replace(/^\s*console\.log\(.*\);\s*$/gm, '');
    content = content.replace(/^\s*console\.log\(.*\);\s*\n/gm, '\n');
    
    // Also handle multi-line console.log
    content = content.replace(/console\.log\([\s\S]*?\);\s*\n/gm, '');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Removed console.log statements from ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Console.log removal completed!');