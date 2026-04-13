const fs = require('fs');
const path = require('path');

const mappings = {
  'MacBook_Air_15_in_M3_Space_Grey_PDP_Image_Position_1__en-IN_e41e162d-4485-45a9-934c-f55f32e7d3a7.webp': 'macbook-air-m3.webp',
  'notebook-xps-15-9530-t-black-gallery-1.avif': 'dell-xps-15.avif',
  '1-29.webp': 'sony-wh1000xm5.webp', 
  '2-553.webp': 'airpods-pro.webp', 
  'apple-mobile-phone-apple-iphone-15-128gb-33291194957956_1200x1200.webp': 'iphone-15.webp',
  'samsung-mobile-phone-samsung-galaxy-s24-ultra-12gb-256gb-screen-warranty-34142454775940_1200x1200.webp': 'samsung-s24.webp',
  'apple-jewelry-apple-watch-series-10-gps-42mm-fitness-tracker-ecg-app-always-on-retina-display-water-resistant-35237428789380_1200x1200.webp': 'apple-watch.webp',
  'Garmin-fenix-8-47-mm-6.webp': 'garmin-fenix.webp',
  'PS5-digital-1.jpg': 'ps5.jpg',
  'meta-quest-3-4.jpg': 'meta-quest-3.jpg',
  'phps1_1__79951.webp': 'philips-hue.webp',
};

for (const [oldName, newName] of Object.entries(mappings)) {
  const oldPath = path.join(__dirname, oldName);
  const newPath = path.join(__dirname, 'public', newName);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${oldName} -> public/${newName}`);
  }
}
