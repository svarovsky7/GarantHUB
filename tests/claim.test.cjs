const fs = require('fs');
const content = fs.readFileSync('src/entities/claim/claim.ts', 'utf8');
if (!content.includes('file_url:path')) {
  throw new Error('Alias for file_url:path not found');
}
console.log('tests passed');
