/**
 * Local SVG Cover Artworks for Mock Fixtures (Zero external network requests)
 */
function createSvgCover(title: string, artist: string, bgGradient: [string, string], accentColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient[0]}"/>
        <stop offset="100%" stop-color="${bgGradient[1]}"/>
      </linearGradient>
      <radialGradient id="r" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="400" height="400" fill="url(#g)"/>
    <circle cx="200" cy="200" r="180" fill="url(#r)"/>
    <circle cx="200" cy="200" r="90" fill="none" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.4"/>
    <circle cx="200" cy="200" r="30" fill="${accentColor}" fill-opacity="0.3"/>
    <circle cx="200" cy="200" r="8" fill="#ffffff" fill-opacity="0.7"/>
    <text x="32" y="320" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="22" fill="#ffffff">${title}</text>
    <text x="32" y="352" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="16" fill="${accentColor}">${artist}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MOCK_ARTWORKS = {
  sunDance: createSvgCover('Sun Dance', 'Aimer', ['#31102f', '#792042'], '#f43f5e'),
  pennyRain: createSvgCover('Penny Rain', 'Aimer', ['#0f172a', '#1e293b'], '#38bdf8'),
  baoTangNuoiTiec: createSvgCover('Bảo Tàng Của Nuối Tiếc', 'Vũ.', ['#2e1065', '#4c1d95'], '#c084fc'),
  beethoven9: createSvgCover('Symphony No. 9', 'Beethoven', ['#1c1917', '#44403c'], '#fbbf24'),
  randomAccessMemories: createSvgCover('Random Access Memories', 'Daft Punk', ['#18181b', '#27272a'], '#e4e4e7'),
  // Missing artwork fixture will be null
};
