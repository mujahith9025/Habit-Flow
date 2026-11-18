const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const icons = [
  // Cache-busting v2 filenames for WebAPK minting server
  { name: 'habitflow-v2-512.png', size: 512, emblemSize: 440, type: 'standard' },
  { name: 'habitflow-v2-192.png', size: 192, emblemSize: 165, type: 'standard' },
  { name: 'habitflow-v2-maskable-512.png', size: 512, emblemSize: 340, type: 'maskable' },
  { name: 'habitflow-v2-maskable-192.png', size: 192, emblemSize: 128, type: 'maskable' },
  { name: 'habitflow-v2-apple-touch-icon.png', size: 180, emblemSize: 154, type: 'standard' },

  // Standard HabitFlow filenames
  { name: 'habitflow-icon-512.png', size: 512, emblemSize: 440, type: 'standard' },
  { name: 'habitflow-icon-192.png', size: 192, emblemSize: 165, type: 'standard' },
  { name: 'habitflow-maskable-512.png', size: 512, emblemSize: 340, type: 'maskable' },
  { name: 'habitflow-maskable-192.png', size: 192, emblemSize: 128, type: 'maskable' },
  { name: 'habitflow-apple-touch-icon.png', size: 180, emblemSize: 154, type: 'standard' },

  // Backwards compatible filenames
  { name: 'icon-512x512.png', size: 512, emblemSize: 440, type: 'standard' },
  { name: 'icon-192x192.png', size: 192, emblemSize: 165, type: 'standard' },
  { name: 'maskable-icon-512x512.png', size: 512, emblemSize: 340, type: 'maskable' },
  { name: 'maskable-icon-192x192.png', size: 192, emblemSize: 128, type: 'maskable' },
  { name: 'apple-touch-icon.png', size: 180, emblemSize: 154, type: 'standard' },
];

function generateHtml(size, emblemSize, type) {
  const pad = (size - emblemSize) / 2;
  const scale = emblemSize / 120;
  
  // For maskable icon: outer background is 100% solid full bleed #141517.
  // The emblem has squircle badge centered inside the 80% safe zone.
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${size}px;
      height: ${size}px;
      overflow: hidden;
      background: #141517;
    }
    .container {
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #141517;
    }
  </style>
</head>
<body>
  <div class="container">
    <svg width="${emblemSize}" height="${emblemSize}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hfBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1E2024" />
          <stop offset="100%" stop-color="#141517" />
        </linearGradient>
        <linearGradient id="hfRibbon" x1="24" y1="90" x2="96" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#2D5A34" />
          <stop offset="50%" stop-color="#4E8A56" />
          <stop offset="100%" stop-color="#88C490" />
        </linearGradient>
        <linearGradient id="hfGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F2D594" />
          <stop offset="100%" stop-color="#D4A373" />
        </linearGradient>
      </defs>

      <!-- Squircle Badge Base -->
      <rect width="120" height="120" rx="32" fill="url(#hfBg)" />
      <rect x="0.75" y="0.75" width="118.5" height="118.5" rx="31.25" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />

      <!-- Continuous Habit Loop into Ascending Checkmark Streak -->
      <path
        d="M 32 60 C 32 46 44 36 58 36 C 72 36 80 46 76 60 C 72 74 60 84 48 84 C 36 84 28 74 34 62 L 52 80 C 56 84 62 84 66 80 L 96 42"
        fill="none"
        stroke="url(#hfRibbon)"
        stroke-width="11"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Today Focus Streak Dot -->
      <circle cx="96" cy="42" r="5.5" fill="url(#hfGold)" />
    </svg>
  </div>
</body>
</html>`;
}

const outDir = path.resolve(__dirname, 'public', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const tempHtml = path.resolve(__dirname, 'temp_icon.html');

for (const icon of icons) {
  const html = generateHtml(icon.size, icon.emblemSize, icon.type);
  fs.writeFileSync(tempHtml, html, 'utf8');

  const destPng = path.join(outDir, icon.name);
  const cmd = `"${CHROME_PATH}" --headless --disable-gpu --hide-scrollbars --window-size=${icon.size},${icon.size} --screenshot="${destPng}" "file://${tempHtml.replace(/\\/g, '/')}"`;
  
  console.log(`Generating ${icon.name} (${icon.size}x${icon.size})...`);
  execSync(cmd, { stdio: 'inherit' });

  const stat = fs.statSync(destPng);
  console.log(`  -> Saved ${icon.name} (${stat.size} bytes)`);
}

if (fs.existsSync(tempHtml)) {
  fs.unlinkSync(tempHtml);
}

console.log('All icons generated successfully!');
