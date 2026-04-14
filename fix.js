const fs = require('fs');
const path = require('path');

// Map of corrupted sequences -> correct replacements
// These are UTF-8 characters that got double-encoded as Latin-1
const fixMap = [
  [/\u00e2\u20ac\u201c/g, '\u2013'],       // â€" -> –  (en dash)
  [/\u00e2\u20ac\u201d/g, '\u2014'],       // â€" -> —  (em dash)
  [/\u00e2\u20ac\u00a2/g, '\u2022'],       // â€¢ -> •  (bullet)
  [/\u00e2\u20ac\u00a6/g, '\u2026'],       // â€¦ -> …  (ellipsis)
  [/\u00e2\u2020\u2019/g, '\u2192'],       // â†' -> →  (right arrow)
  [/\u00e2\u02c6\u2019/g, '\u2192'],       // alternate ->
  [/\u00e2\u20ac\u2039/g, '\u2018'],       // â€˜ -> '  (left single quote)
  [/\u00e2\u20ac\u2122/g, '\u2019'],       // â€™ -> '  (right single quote / apostrophe)
  [/\u00e2\u20ac\u0153/g, '\u201c'],       // â€œ -> "  (left double quote)
  [/\u00e2\u20ac\ufffd/g, '\u201d'],       // â€ -> "   (right double quote)
  [/\u00c2\u00a9/g, '\u00a9'],            // Â© -> ©
  [/\u00c2\u00ae/g, '\u00ae'],            // Â® -> ®
  [/\u00c3\u00a9/g, '\u00e9'],            // Ã© -> é
  [/\u00c3\u00a8/g, '\u00e8'],            // Ã¨ -> è
  [/\u00e2\u02c6\u2019/g, '\u2192'],
  // The broken pin emoji
  [/\u00f0\u0178\u201d\u203a/g, '\ud83d\udccd'],  // ðŸ" -> 📍
  // Corrupted minus sign in qty buttons
  [/\u00e2\u02c6\u2019/g, '\u2212'],      // âˆ' -> −
];

const publicDir = path.join(__dirname, 'public');
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

let totalFixed = 0;

htmlFiles.forEach(file => {
  const fullPath = path.join(publicDir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  fixMap.forEach(([pattern, replacement]) => {
    content = content.replace(pattern, replacement);
  });

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed: ${file}`);
    totalFixed++;
  } else {
    console.log(`Clean: ${file}`);
  }
});

// Also fix shop.html specific text corruptions that are literals in the file
const shopPath = path.join(publicDir, 'shop.html');
let shopContent = fs.readFileSync(shopPath, 'utf8');
shopContent = shopContent.replace(/Loading productsâ€¦/g, 'Loading products…');
shopContent = shopContent.replace(/Product nameâ€¦/g, 'Product name…');
shopContent = shopContent.replace(/Loading productsâ€¦/g, 'Loading products…');
shopContent = shopContent.replace(/Price: Low â†' High/g, 'Price: Low → High');
shopContent = shopContent.replace(/Price: High â†' Low/g, 'Price: High → Low');
shopContent = shopContent.replace(/Name A â†' Z/g, 'Name A → Z');
shopContent = shopContent.replace(/â€"/g, '—');
fs.writeFileSync(shopPath, shopContent, 'utf8');

console.log('\nDone! Fixed ' + totalFixed + ' files.');
