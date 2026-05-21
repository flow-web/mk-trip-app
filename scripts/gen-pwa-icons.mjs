import sharp from 'sharp'

// SVG plat MK Trip — fond sable + "MK" en charbon
const SVG_FULL = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#F2EDE3"/>
  <text x="512" y="640" font-family="-apple-system, system-ui, sans-serif" font-size="500" font-weight="800" fill="#1C1A17" text-anchor="middle" letter-spacing="-30">MK</text>
</svg>`

// Variante maskable : safe-zone 12% (logo dans cercle utile, fond pleine bleed)
const SVG_MASKABLE = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#F2EDE3"/>
  <text x="512" y="580" font-family="-apple-system, system-ui, sans-serif" font-size="380" font-weight="800" fill="#1C1A17" text-anchor="middle" letter-spacing="-20">MK</text>
</svg>`

await sharp(Buffer.from(SVG_FULL(192))).resize(192, 192).png().toFile('public/icons/192.png')
await sharp(Buffer.from(SVG_FULL(512))).resize(512, 512).png().toFile('public/icons/512.png')
await sharp(Buffer.from(SVG_MASKABLE(512))).resize(512, 512).png().toFile('public/icons/512-maskable.png')

console.log('✓ Icons generated: 192.png, 512.png, 512-maskable.png')
