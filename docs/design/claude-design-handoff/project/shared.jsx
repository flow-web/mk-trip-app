// shared.jsx — design system primitives for MK Trip
// All exported to window so other scripts can use them.

// ─────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────
const MK = {
  // Neutrals (light)
  paper: '#F2EDE3',       // app bg
  paperDeep: '#E8E0CF',   // card hover / divider zone
  sand: '#DDD2BD',        // chip bg
  ink: '#1C1A17',         // primary text
  inkSoft: '#3D362C',     // secondary
  inkMute: '#7A6F60',     // muted / labels
  hairline: 'rgba(28,26,23,.08)',
  hairlineStrong: 'rgba(28,26,23,.16)',

  // Neutrals (dark)
  paperDark: '#16140F',
  paperDarkDeep: '#1F1C16',
  sandDark: '#2A251D',
  inkDark: '#F2EDE3',
  inkSoftDark: '#CFC6B4',
  inkMuteDark: '#8B8273',
  hairlineDark: 'rgba(242,237,227,.10)',
  hairlineStrongDark: 'rgba(242,237,227,.20)',

  // Accents per trip type
  skate:    { base: '#C75A20', deep: '#8C3A0F', tint: '#F4E2D2', tintDark: '#3A1E0F' },
  rando:    { base: '#5A6E3E', deep: '#3A4925', tint: '#E5E6D6', tintDark: '#1F2515' },
  surf:     { base: '#1E3A5C', deep: '#0F2238', tint: '#DCE3EB', tintDark: '#10202F' },
  city:     { base: '#B14E32', deep: '#7A3018', tint: '#F1DDD2', tintDark: '#341A11' },

  // Semantic
  danger: '#A33A2A',
  ok: '#5A6E3E',
};

// Inject fonts + base styles once
if (typeof document !== 'undefined' && !document.getElementById('mk-fonts')) {
  const link = document.createElement('link');
  link.id = 'mk-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Geist:wght@300..700&family=Geist+Mono:wght@400..600&display=swap';
  document.head.appendChild(link);

  const s = document.createElement('style');
  s.id = 'mk-styles';
  s.textContent = `
    .mk { font-family: 'Geist', -apple-system, system-ui, sans-serif; color: ${MK.ink}; }
    .mk-display { font-family: 'Bricolage Grotesque', serif; font-weight: 800; letter-spacing: -0.025em; line-height: 0.95; }
    .mk-display-italic { font-family: 'Bricolage Grotesque', serif; font-style: italic; font-weight: 500; letter-spacing: -0.01em; }
    .mk-mono { font-family: 'Geist Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
    .mk-eyebrow { font-family: 'Geist Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 500; }
    .mk * { box-sizing: border-box; }
    .mk-noscroll::-webkit-scrollbar { display: none; }
    .mk-noscroll { scrollbar-width: none; }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────
// Icons (Lucide-style, stroke 1.75)
// ─────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, stroke = 1.75, color = 'currentColor', style }) => {
  const paths = {
    map:        <><path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2z"/><path d="M9 3v16"/><path d="M15 5v16"/></>,
    home:       <><path d="M3 11L12 4l9 7"/><path d="M5 10v10h14V10"/></>,
    calendar:   <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
    wallet:     <><path d="M3 7h15a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/><path d="M3 7l3-3h11l3 3"/><circle cx="17" cy="13.5" r="1.2" fill="currentColor"/></>,
    book:       <><path d="M4 4h7a4 4 0 014 4v13"/><path d="M20 4h-7a4 4 0 00-4 4v13"/></>,
    chevDown:   <path d="M6 9l6 6 6-6"/>,
    chevRight:  <path d="M9 6l6 6-6 6"/>,
    chevLeft:   <path d="M15 6l-6 6 6 6"/>,
    plus:       <><path d="M12 5v14M5 12h14"/></>,
    search:     <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    bell:       <><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 004 0"/></>,
    pin:        <><path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/><circle cx="12" cy="9" r="2.5"/></>,
    cloud:      <><path d="M17 18a4 4 0 000-8 6 6 0 00-11.5 1.5A4 4 0 006 18h11z"/></>,
    sun:        <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></>,
    moon:       <path d="M21 12.8A8 8 0 0111.2 3a7 7 0 1010 9.8z"/>,
    chart:      <><path d="M3 21V8M9 21V4M15 21v-9M21 21V12"/></>,
    car:        <><path d="M5 17h14M5 12l1.5-4a2 2 0 012-1.5h7a2 2 0 012 1.5L19 12M5 17v3M19 17v3M5 12h14v5H5z"/><circle cx="8" cy="14.5" r=".8" fill="currentColor"/><circle cx="16" cy="14.5" r=".8" fill="currentColor"/></>,
    arrow:      <><path d="M4 12h16M14 6l6 6-6 6"/></>,
    arrowDown:  <><path d="M12 4v16M6 14l6 6 6-6"/></>,
    arrowUp:    <><path d="M12 4v16M6 10l6-6 6 6"/></>,
    check:      <path d="M4 12l5 5L20 6"/>,
    x:          <><path d="M6 6l12 12M18 6L6 18"/></>,
    more:       <><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></>,
    moreV:      <><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></>,
    receipt:    <><path d="M5 3h14v18l-3-1.5L13 21l-3-1.5L7 21l-2-1.5V3z"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
    user:       <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></>,
    users:      <><circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0114 0"/><path d="M16 4a3.5 3.5 0 010 7"/><path d="M17 20a7 7 0 00-1-3.5"/></>,
    clock:      <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    drop:       <path d="M12 3l-5 8a5 5 0 0010 0L12 3z"/>,
    wind:       <><path d="M3 8h13a3 3 0 100-6"/><path d="M3 14h17a3 3 0 100-6"/><path d="M3 20h9a3 3 0 100-6"/></>,
    waves:      <><path d="M2 7c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 13c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/></>,
    mountain:   <><path d="M3 20l6-12 4 7 3-4 5 9z"/><circle cx="9" cy="6" r="1.5"/></>,
    flame:      <path d="M12 2s-3 5-3 8a3 3 0 006 0 4 4 0 00-3-4s2 6-1 8c-3 2-6-2-6-5 0 6 4 10 8 10s8-4 8-9-5-8-9-8z"/>,
    filter:     <path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/>,
    layers:     <><path d="M12 2L2 8l10 6 10-6-10-6z"/><path d="M2 14l10 6 10-6"/></>,
    settings:   <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    grip:       <><circle cx="9" cy="6" r="1.3" fill="currentColor"/><circle cx="15" cy="6" r="1.3" fill="currentColor"/><circle cx="9" cy="12" r="1.3" fill="currentColor"/><circle cx="15" cy="12" r="1.3" fill="currentColor"/><circle cx="9" cy="18" r="1.3" fill="currentColor"/><circle cx="15" cy="18" r="1.3" fill="currentColor"/></>,
    target:     <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
    list:       <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.3" fill="currentColor"/><circle cx="3.5" cy="12" r="1.3" fill="currentColor"/><circle cx="3.5" cy="18" r="1.3" fill="currentColor"/></>,
    route:      <><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v4a4 4 0 004 4h4"/></>,
    flag:       <><path d="M5 21V3"/><path d="M5 3h12l-2 4 2 4H5"/></>,
    coffee:     <><path d="M4 8h13v6a4 4 0 01-4 4H8a4 4 0 01-4-4V8z"/><path d="M17 10h2a2 2 0 010 4h-2"/><path d="M8 4v2M12 4v2"/></>,
    fuel:       <><path d="M3 21V5a2 2 0 012-2h7a2 2 0 012 2v16"/><path d="M3 11h11"/><path d="M14 7l3 3v8a2 2 0 002 2 2 2 0 002-2v-9l-3-3"/></>,
    bed:        <><path d="M3 18V7M21 18v-6a3 3 0 00-3-3H3"/><circle cx="7" cy="11" r="2"/><path d="M9 13h12"/></>,
    camera:     <><path d="M3 8h4l2-3h6l2 3h4v12H3V8z"/><circle cx="12" cy="13" r="4"/></>,
    luggage:    <><rect x="6" y="6" width="12" height="15" rx="2"/><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"/><path d="M10 11v6M14 11v6"/></>,
    // Custom outdoor pictos (filled aplat)
    skateboard: <><ellipse cx="12" cy="10" rx="9" ry="2.5" fill="currentColor" stroke="none"/><circle cx="6" cy="14" r="1.6" fill="currentColor" stroke="none"/><circle cx="18" cy="14" r="1.6" fill="currentColor" stroke="none"/></>,
    wave:       <path d="M2 14c2.5 0 4-4 7-4s4 4 7 4 4-4 6-4v6H2z" fill="currentColor" stroke="none"/>,
    peak:       <path d="M2 20L9 6l4 7 3-3 6 10z" fill="currentColor" stroke="none"/>,
    van:        <><path d="M2 17V9a2 2 0 012-2h9l4 3h4a1 1 0 011 1v6h-2a2.5 2.5 0 01-5 0H9a2.5 2.5 0 01-5 0H2z" fill="currentColor" stroke="none"/><circle cx="6.5" cy="17.5" r="1.6" fill="#fff" stroke="none"/><circle cx="16.5" cy="17.5" r="1.6" fill="#fff" stroke="none"/></>,
    spark:      <><path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4"/></>,
  };
  const isFilled = ['skateboard','wave','peak','van'].includes(name);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={isFilled ? color : 'none'}
      stroke={isFilled ? 'none' : color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ flex: 'none', display: 'block', ...style }}>
      {paths[name] || null}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// Status bar (iOS-style)
// ─────────────────────────────────────────────────────────────
const StatusBar = ({ tone = 'dark', time = '09:41' }) => {
  const c = tone === 'light' ? '#fff' : MK.ink;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 24px 6px', height: 44, color: c, fontFamily: 'Geist, sans-serif',
      fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', flex: 'none' }}>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{time}</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {/* signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill={c}>
          <rect x="0" y="7" width="3" height="4" rx="0.5"/>
          <rect x="4.5" y="5" width="3" height="6" rx="0.5"/>
          <rect x="9" y="2.5" width="3" height="8.5" rx="0.5"/>
          <rect x="13.5" y="0" width="3" height="11" rx="0.5"/>
        </svg>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill={c}>
          <path d="M7.5 0C4.6 0 1.95 1.1 0 2.86l1.3 1.4A8.5 8.5 0 017.5 1.8c2.3 0 4.4.85 6.2 2.46l1.3-1.4A11.13 11.13 0 007.5 0zm0 3.6a7.4 7.4 0 00-4.84 1.79l1.3 1.4a5.55 5.55 0 017.08 0l1.3-1.4A7.4 7.4 0 007.5 3.6zm0 3.6a3.74 3.74 0 00-2.42.88L7.5 11l2.42-2.92A3.74 3.74 0 007.5 7.2z"/>
        </svg>
        {/* battery */}
        <svg width="27" height="12" viewBox="0 0 27 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke={c} opacity="0.4"/>
          <rect x="2" y="2" width="19" height="8" rx="1.5" fill={c}/>
          <path d="M24 4v4a2 2 0 002-2 2 2 0 00-2-2z" fill={c} opacity="0.4"/>
        </svg>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Bottom tab bar — 5 tabs persistent
// ─────────────────────────────────────────────────────────────
const BottomTab = ({ active = 'home', tone = 'light', accent = MK.skate.base }) => {
  const dark = tone === 'dark';
  const tabs = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'map', icon: 'map', label: 'Map' },
    { id: 'plan', icon: 'calendar', label: 'Planning' },
    { id: 'split', icon: 'wallet', label: 'Split' },
    { id: 'guide', icon: 'book', label: 'Guide' },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around', alignItems: 'stretch',
      borderTop: `1px solid ${dark ? MK.hairlineDark : MK.hairline}`,
      background: dark ? MK.paperDark : MK.paper,
      paddingTop: 8, paddingBottom: 22, flex: 'none',
    }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        const color = isActive ? accent : (dark ? MK.inkMuteDark : MK.inkMute);
        return (
          <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1, position: 'relative' }}>
            {isActive && <div style={{ position: 'absolute', top: -9, width: 22, height: 2.5, background: accent, borderRadius: 2 }} />}
            <Icon name={t.icon} size={22} color={color} stroke={isActive ? 2 : 1.6} />
            <div style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, color, letterSpacing: '0.01em' }}>{t.label}</div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Home indicator (iOS bottom bar pill)
// ─────────────────────────────────────────────────────────────
const HomeIndicator = ({ tone = 'light' }) => (
  <div style={{ height: 6, display: 'flex', justifyContent: 'center', flex: 'none', background: tone === 'dark' ? MK.paperDark : MK.paper }}>
    <div style={{ width: 134, height: 5, borderRadius: 3, background: tone === 'dark' ? MK.inkDark : MK.ink, opacity: tone === 'dark' ? 0.5 : 0.8 }} />
  </div>
);

// ─────────────────────────────────────────────────────────────
// Photos — curated Unsplash IDs per category
// ─────────────────────────────────────────────────────────────
const PHOTO = {
  // Skate / road trip Sud-Ouest
  skate_hero:   'https://images.unsplash.com/photo-1531565637446-32307b194362?w=900&q=80', // skater action (hero)
  skate_bowl:   'https://images.unsplash.com/photo-1583407723467-9b2d22504831?w=600&q=80', // concrete bowl
  skate_van:    'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=600&q=80', // sunset road
  skate_road:   'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=600&q=80', // sunset road
  skate_spot2:  'https://images.unsplash.com/photo-1564982752979-3f7693f76b4a?w=600&q=80', // skater silhouette

  // Rando / GR20 Corse
  rando_hero:   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80', // mountain ridge
  rando_tent:   'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80', // tent
  rando_summit: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80', // hiker silhouette
  rando_lake:   'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=600&q=80', // alpine lake
  rando_trail:  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80', // trail

  // Surf
  surf_hero:    'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=900&q=80', // wave
  surf_board:   'https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=600&q=80', // surfer

  // City break Lisbonne
  city_hero:    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=900&q=80', // Lisbon miradouro
  city_tram:    'https://images.unsplash.com/photo-1513735492246-483525079686?w=600&q=80', // tram
  city_food:    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&q=80', // pastel de nata
  city_view:    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80', // miradouro
};

// Avatar dot
const Avatar = ({ name, size = 24, bg, color = '#fff', border }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Geist, sans-serif', fontWeight: 600, fontSize: size * 0.42,
    letterSpacing: '-0.02em', flex: 'none', border: border || 'none' }}>
    {name}
  </div>
);

const AvatarStack = ({ people, size = 24, max = 4, dark = false, accent }) => {
  const shown = people.slice(0, max);
  return (
    <div style={{ display: 'flex' }}>
      {shown.map((p, i) => (
        <div key={i} style={{ marginLeft: i ? -size * 0.32 : 0 }}>
          <Avatar name={p.n} size={size} bg={p.c} border={`2px solid ${dark ? MK.paperDark : MK.paper}`} />
        </div>
      ))}
      {people.length > max && (
        <div style={{ marginLeft: -size * 0.32 }}>
          <Avatar name={`+${people.length - max}`} size={size} bg={accent || MK.ink} border={`2px solid ${dark ? MK.paperDark : MK.paper}`} />
        </div>
      )}
    </div>
  );
};

Object.assign(window, { MK, Icon, StatusBar, BottomTab, HomeIndicator, PHOTO, Avatar, AvatarStack });
