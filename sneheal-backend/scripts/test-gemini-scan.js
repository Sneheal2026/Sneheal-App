require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { extractMedicineNames } = require('../src/services/gemini.service');

async function main() {
  const samplePath = process.argv[2];

  if (!samplePath) {
    console.log('Usage: node scripts/test-gemini-scan.js <path-to-image>');
    process.exit(1);
  }

  const absolutePath = path.resolve(samplePath);

  if (!fs.existsSync(absolutePath)) {
    console.error('File not found:', absolutePath);
    process.exit(1);
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  const buffer = fs.readFileSync(absolutePath);

  console.log('Testing Gemini scan with:', absolutePath);

  const names = await extractMedicineNames(buffer, mimeType);
  console.log('Medicine names:', names);
}

main().catch((error) => {
  console.error('Test failed:', error.message);
  process.exit(1);
});
