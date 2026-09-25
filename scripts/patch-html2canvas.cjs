const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.js'),
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.esm.js'),
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.min.js')
];

filesToPatch.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const targetError = 'throw new Error("Attempting to parse an unsupported color function \\"" + value.name + "\\"");';
    const targetErrorAlt = "throw new Error('Attempting to parse an unsupported color function \"'+value.name+'\"');";
    const targetMin = 'throw new Error("Attempting to parse an unsupported color function \\""+n.name+"\\"");';

    let patched = false;
    if (content.includes(targetError)) {
      content = content.replace(targetError, 'return 0;');
      patched = true;
    }
    if (content.includes(targetErrorAlt)) {
      content = content.replace(targetErrorAlt, 'return 0;');
      patched = true;
    }
    if (content.includes(targetMin)) {
      content = content.replace(targetMin, 'return 0;');
      patched = true;
    }
    // Also catch regex for minified variations
    const genericRegex = /throw new Error\(["']Attempting to parse an unsupported color function [^)]+\);/g;
    if (genericRegex.test(content)) {
      content = content.replace(genericRegex, 'return 0;');
      patched = true;
    }

    if (patched) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully patched html2canvas color parser in: ${filePath}`);
    } else {
      console.log(`html2canvas target already patched or not found in: ${filePath}`);
    }
  }
});
