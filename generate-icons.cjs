const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output directory exists
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to generate a valid PNG with HabitFlow brand colors & design
function createHabitFlowPNG(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Raw RGBA buffer with filter byte per scanline
  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowStride);

  // Colors: Primary #006398, Gradient Top #64b5f6, Accent Green #286b33, White #ffffff
  const radius = isMaskable ? width * 0.45 : width * 0.38;
  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient (Vertical: #64b5f6 to #006398)
      const gradRatio = y / height;
      let r = Math.round(100 * (1 - gradRatio) + 0 * gradRatio);
      let g = Math.round(181 * (1 - gradRatio) + 99 * gradRatio);
      let b = Math.round(246 * (1 - gradRatio) + 152 * gradRatio);
      let a = 255;

      // Rounded squircle background for standard icons
      if (!isMaskable) {
        const cornerDist = Math.max(Math.abs(dx) - (width * 0.28), 0) ** 2 + Math.max(Math.abs(dy) - (height * 0.28), 0) ** 2;
        if (cornerDist > (width * 0.2) ** 2) {
          // Transparent outside squircle
          r = 0; g = 0; b = 0; a = 0;
        }
      }

      // Draw peaceful leaf/lotus habit icon motif in the center (White + Mint dot)
      if (a > 0) {
        // Leaf shape calculation: (x-cx)^2 / w + (y - (cy + offset))^2
        const leafY = dy + size * 0.05;
        const normY = (leafY + size * 0.25) / (size * 0.5); // 0 to 1 from tip to base
        if (normY >= 0 && normY <= 1) {
          const halfWidth = Math.sin(normY * Math.PI) * (size * 0.22);
          if (Math.abs(dx) <= halfWidth) {
            // Leaf body (White)
            r = 255;
            g = 255;
            b = 255;
            a = 255;

            // Inner leaf shade
            if (Math.abs(dx) <= halfWidth * 0.6 && normY > 0.3) {
              r = 230;
              g = 245;
              b = 255;
            }
          }
        }

        // Center success dot (#286b33)
        const dotDist = Math.sqrt(dx * dx + (dy - size * 0.12) ** 2);
        if (dotDist <= size * 0.055) {
          r = 40;
          g = 107;
          b = 51;
          a = 255;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Deflate image data
  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter: 0
  ihdrData[12] = 0; // Interlace: 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation for PNG chunks
function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Standard CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate all standard PWA icon files
const iconFiles = [
  { name: 'icon-192x192.png', size: 192, isMaskable: false },
  { name: 'icon-512x512.png', size: 512, isMaskable: false },
  { name: 'maskable-icon-512x512.png', size: 512, isMaskable: true },
  { name: 'apple-touch-icon.png', size: 180, isMaskable: false },
];

iconFiles.forEach((file) => {
  const filePath = path.join(iconsDir, file.name);
  const buffer = createHabitFlowPNG(file.size, file.isMaskable);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated: ${file.name} (${file.size}x${file.size})`);
});
