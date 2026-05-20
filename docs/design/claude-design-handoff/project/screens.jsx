// screens.jsx — the 5 mobile screens (light mode, skate baseline)

// ─────────────────────────────────────────────────────────────
// Crew per trip
// ─────────────────────────────────────────────────────────────
const CREW_SKATE = [
  { n: 'TM', c: '#C75A20', name: 'Théo' },
  { n: 'LL', c: '#5A6E3E', name: 'Léa' },
  { n: 'MK', c: '#1E3A5C', name: 'Mika' },
  { n: 'JR', c: '#B14E32', name: 'Jordan' },
  { n: 'NS', c: '#3D362C', name: 'Naïs' },
];

// ─────────────────────────────────────────────────────────────
// Phone shell
// ─────────────────────────────────────────────────────────────
const Phone = ({ children, tone = 'light', accent }) => (
  <div className="mk mk-noscroll" style={{
    width: 375, height: 812, background: tone === 'dark' ? MK.paperDark : MK.paper,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    color: tone === 'dark' ? MK.inkDark : MK.ink,
  }}>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Top bar with trip switcher
// ─────────────────────────────────────────────────────────────
const TripSwitcher = ({ tone = 'light', accent = MK.skate.base, label = 'Sud-Ouest', sublabel = 'Skate · 5 potes', dot = '#C75A20' }) => {
  const dark = tone === 'dark';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Icon name="skateboard" size={20} color="#fff" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: dark ? MK.inkDark : MK.ink }}>{label}</div>
            <Icon name="chevDown" size={16} color={dark ? MK.inkMuteDark : MK.inkMute} />
          </div>
          <div className="mk-mono" style={{ fontSize: 10, color: dark ? MK.inkMuteDark : MK.inkMute, letterSpacing: '0.04em', marginTop: 1 }}>{sublabel}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, border: `1px solid ${dark ? MK.hairlineDark : MK.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Icon name="bell" size={18} color={dark ? MK.inkDark : MK.ink} />
          <div style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: '50%', background: accent, border: `1.5px solid ${dark ? MK.paperDark : MK.paper}` }} />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 1. HOME / DASHBOARD
// ─────────────────────────────────────────────────────────────
const HomeScreen = ({ tone = 'light', accent = MK.skate.base, tint = MK.skate.tint, deep = MK.skate.deep,
  trip = { label: 'Sud-Ouest', sub: 'Skate · 5 potes', dot: '#C75A20', photo: PHOTO.skate_hero,
    eyebrow: 'ROAD TRIP · 28 MAI → 4 JUIN', display: 'Bayonne /\nBordeaux',
    metaLeft: 'JOUR 3 / 7', metaRight: '437 km',
    nextSpot: { name: 'Bowl du Prado', time: '14:30', sub: 'Marseille · 12 min de route' },
    expense: { who: 'Théo', amount: '48,20 €', label: 'Plein essence' },
    weather: { temp: '24°', cond: 'Soleil · vent 12 km/h' },
    stats: [
      { label: 'km parcourus', val: '437', unit: 'km' },
      { label: 'spots faits', val: '8 / 14' },
      { label: 'budget', val: '312 €', unit: '/ 800' },
    ],
    skatey: true,
  } }) => {
  const dark = tone === 'dark';
  return (
    <Phone tone={tone}>
      <StatusBar tone="light" />
      {/* Hero full-bleed (replaces status bar bg too) */}
      <div style={{ position: 'relative', height: 320, marginTop: -50, background: `url(${trip.photo}) center/cover` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0) 60%, rgba(0,0,0,.78) 100%)' }} />
        <div style={{ position: 'absolute', top: 50, left: 0, right: 0 }}>
          <div style={{ color: '#fff' }}>
            <TripSwitcher tone="dark" accent="rgba(255,255,255,.18)" label={trip.label} sublabel={trip.sub} dot={trip.dot} />
          </div>
        </div>
        {/* Bottom-left content */}
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18, color: '#fff' }}>
          <div className="mk-eyebrow" style={{ color: 'rgba(255,255,255,.85)' }}>{trip.eyebrow}</div>
          <div className="mk-display" style={{ fontSize: 44, marginTop: 8, whiteSpace: 'pre-line', color: '#fff' }}>{trip.display}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
            <div style={{ background: accent, color: '#fff', padding: '6px 10px', borderRadius: 4 }}>
              <div className="mk-display-italic" style={{ fontSize: 16 }}>{trip.metaLeft}</div>
            </div>
            <div className="mk-mono" style={{ fontSize: 13, color: '#fff' }}>{trip.metaRight} · {trip.stats?.[1]?.val || '8/14'} spots</div>
          </div>
        </div>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }} className="mk-noscroll">
        {/* À venir aujourd'hui — horizontal carousel */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div className="mk-eyebrow" style={{ color: MK.inkMute }}>À VENIR · AUJOURD'HUI</div>
            <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 22, marginTop: 4 }}>Encore 3 choses.</div>
          </div>
          <Icon name="chevRight" size={20} color={MK.inkMute} />
        </div>

        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginLeft: -20, paddingLeft: 20, marginRight: -20, paddingRight: 20 }} className="mk-noscroll">
          {/* Card 1 — next spot */}
          <div style={{ width: 220, flex: 'none', background: '#fff', borderRadius: 12, border: `1px solid ${MK.hairline}`, padding: 14, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, background: accent, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="skateboard" size={12} color="#fff" />
              </div>
              <div className="mk-mono" style={{ fontSize: 10, color: MK.inkMute, letterSpacing: '0.04em' }}>PROCHAIN SPOT · {trip.nextSpot.time}</div>
            </div>
            <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 19, marginTop: 10, letterSpacing: '-0.02em' }}>{trip.nextSpot.name}</div>
            <div style={{ fontSize: 12, color: MK.inkMute, marginTop: 2 }}>{trip.nextSpot.sub}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <AvatarStack people={CREW_SKATE.slice(0, 4)} size={22} accent={accent} />
              <div className="mk-mono" style={{ fontSize: 11, color: accent, fontWeight: 600 }}>4 / 5 OK</div>
            </div>
          </div>

          {/* Card 2 — expense */}
          <div style={{ width: 200, flex: 'none', background: MK.ink, color: MK.paper, borderRadius: 12, padding: 14 }}>
            <div className="mk-mono" style={{ fontSize: 10, color: 'rgba(242,237,227,.6)', letterSpacing: '0.04em' }}>À RÉGLER · -2 J</div>
            <div className="mk-display" style={{ fontSize: 28, marginTop: 12, color: '#fff' }}>{trip.expense.amount}</div>
            <div style={{ fontSize: 13, color: 'rgba(242,237,227,.85)', marginTop: 2 }}>{trip.expense.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
              <Avatar name="TM" bg={accent} size={20} />
              <div style={{ fontSize: 12, color: 'rgba(242,237,227,.85)' }}>Théo a avancé</div>
            </div>
          </div>

          {/* Card 3 — weather */}
          <div style={{ width: 180, flex: 'none', background: tint, borderRadius: 12, padding: 14 }}>
            <div className="mk-mono" style={{ fontSize: 10, color: deep, letterSpacing: '0.04em' }}>MÉTÉO · BAYONNE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 12, gap: 6 }}>
              <div className="mk-display" style={{ fontSize: 38, color: deep }}>{trip.weather.temp}</div>
              <Icon name="sun" size={20} color={deep} />
            </div>
            <div style={{ fontSize: 12, color: deep, marginTop: 4, opacity: 0.8 }}>{trip.weather.cond}</div>
          </div>
        </div>

        {/* Crew stats */}
        <div style={{ marginTop: 28 }}>
          <div className="mk-eyebrow" style={{ color: MK.inkMute }}>LE CREW EN CHIFFRES</div>
          <div style={{ marginTop: 12, background: '#fff', borderRadius: 12, border: `1px solid ${MK.hairline}`, overflow: 'hidden' }}>
            {trip.stats.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                padding: '14px 16px', borderTop: i ? `1px solid ${MK.hairline}` : 'none' }}>
                <div style={{ fontSize: 13, color: MK.inkSoft }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <div className="mk-display" style={{ fontSize: 22 }}>{s.val}</div>
                  {s.unit && <div className="mk-mono" style={{ fontSize: 11, color: MK.inkMute }}>{s.unit}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { n: 'receipt', l: 'Dépense' },
            { n: 'pin', l: 'Spot' },
            { n: 'calendar', l: 'Jour' },
          ].map((q, i) => (
            <div key={i} style={{ background: '#fff', border: `1px solid ${MK.hairline}`, borderRadius: 12, padding: '14px 12px',
              display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
              <div style={{ width: 30, height: 30, background: MK.paper, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={q.n} size={16} color={MK.ink} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{q.l}</div>
              <Icon name="plus" size={14} color={MK.inkMute} style={{ position: 'relative', top: -22, left: 'calc(100% - 32px)' }} />
            </div>
          ))}
        </div>
      </div>

      <BottomTab active="home" tone={tone} accent={accent} />
      <HomeIndicator tone={tone} />
    </Phone>
  );
};

// ─────────────────────────────────────────────────────────────
// 2. MAP
// ─────────────────────────────────────────────────────────────
const MapScreen = ({ tone = 'light', accent = MK.skate.base }) => {
  const dark = tone === 'dark';

  // Fake map with terrain pattern + route + pins
  const pins = [
    { x: 80, y: 110, kind: 'spot', label: 'Anglet', active: false },
    { x: 130, y: 180, kind: 'bed', label: 'Airbnb', active: false },
    { x: 200, y: 230, kind: 'spot', label: 'Bayonne', active: true },
    { x: 240, y: 340, kind: 'fuel', label: 'Station', active: false },
    { x: 290, y: 410, kind: 'spot', label: 'Hossegor', active: false },
  ];

  return (
    <Phone tone={tone}>
      <StatusBar tone={tone === 'dark' ? 'light' : 'dark'} />

      {/* Top bar overlay */}
      <div style={{ padding: '6px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, background: accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="skateboard" size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>Sud-Ouest</div>
            <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, letterSpacing: '0.04em' }}>14 SPOTS · 437 KM</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${MK.hairline}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="filter" size={16} color={MK.ink} />
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${MK.hairline}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="layers" size={16} color={MK.ink} />
          </div>
        </div>
      </div>

      {/* Map area */}
      <div style={{ position: 'relative', flex: 1, background: '#EDE6D5', overflow: 'hidden' }}>
        {/* terrain — contour lines */}
        <svg width="100%" height="100%" viewBox="0 0 375 550" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          {/* land masses */}
          <path d="M 0 280 Q 50 240, 110 260 T 240 250 Q 290 240, 375 280 L 375 600 L 0 600 Z" fill="#D9CCAE" opacity="0.5"/>
          <path d="M 0 320 Q 80 280, 160 300 T 320 295 L 375 320 L 375 600 L 0 600 Z" fill="#C5B58F" opacity="0.4"/>
          {/* coastline / contour */}
          <path d="M -20 200 Q 60 170, 130 200 T 280 195 Q 340 200, 400 220" fill="none" stroke={MK.surf.base} strokeWidth="2" opacity="0.4"/>
          <path d="M 0 250 Q 80 220, 150 245 T 300 245 Q 350 250, 400 270" fill="none" stroke={MK.surf.base} strokeWidth="1" opacity="0.25"/>
          {/* route line dashed */}
          <path d="M 80 110 Q 100 150, 130 180 T 200 230 Q 230 280, 240 340 T 290 410" fill="none" stroke={MK.ink} strokeWidth="2.5" strokeDasharray="2 6" strokeLinecap="round"/>
        </svg>

        {/* Place labels */}
        <div style={{ position: 'absolute', left: 40, top: 80, fontFamily: 'Geist Mono', fontSize: 9, color: MK.inkMute, letterSpacing: '0.1em' }}>ANGLET</div>
        <div style={{ position: 'absolute', right: 30, top: 50, fontFamily: 'Geist Mono', fontSize: 9, color: MK.inkMute, letterSpacing: '0.1em' }}>BIARRITZ</div>
        <div style={{ position: 'absolute', left: 20, top: 380, fontFamily: 'Bricolage Grotesque', fontStyle: 'italic', fontSize: 22, color: MK.surf.base, opacity: 0.4 }}>Atlantique</div>

        {/* Pins */}
        {pins.map((p, i) => {
          const c = p.active ? accent : MK.ink;
          const iconName = p.kind === 'bed' ? 'bed' : p.kind === 'fuel' ? 'fuel' : 'skateboard';
          return (
            <div key={i} style={{ position: 'absolute', left: p.x - 16, top: p.y - 38, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {p.active && (
                <div style={{ background: MK.ink, color: '#fff', fontSize: 11, fontWeight: 500, padding: '4px 8px', borderRadius: 4, marginBottom: 4, whiteSpace: 'nowrap' }}>
                  Bowl du Prado
                </div>
              )}
              <div style={{ width: 32, height: 32, borderRadius: '50% 50% 50% 0', background: c,
                transform: 'rotate(-45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,.25)', border: '2px solid #fff' }}>
                <div style={{ transform: 'rotate(45deg)' }}>
                  <Icon name={iconName} size={14} color="#fff" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Floating controls */}
        <div style={{ position: 'absolute', right: 16, top: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ width: 36, height: 36, background: '#fff', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="target" size={18} color={MK.ink} />
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', marginTop: -28, padding: '12px 0 0', position: 'relative', zIndex: 1, boxShadow: '0 -4px 24px rgba(0,0,0,.08)' }}>
        <div style={{ width: 38, height: 4, background: MK.hairlineStrong, borderRadius: 2, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          <div>
            <div className="mk-eyebrow" style={{ color: MK.inkMute }}>JOUR 3 · BAYONNE</div>
            <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 18, marginTop: 2 }}>5 spots à choper</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Tous', 'Jour', 'Type'].map((f, i) => (
              <div key={f} style={{ padding: '5px 10px', borderRadius: 999, background: i === 1 ? MK.ink : 'transparent', color: i === 1 ? '#fff' : MK.inkSoft, fontSize: 11, fontWeight: 500, border: i === 1 ? 'none' : `1px solid ${MK.hairlineStrong}` }}>{f}</div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14, padding: '0 20px 16px' }}>
          {[
            { name: 'Bowl du Prado', type: 'Skatepark', dist: '12 min', time: '14:30', votes: 4, active: true },
            { name: 'Plein essence — Total', type: 'Station', dist: '23 min', time: '15:50', votes: null },
            { name: 'Skatepark Anglet', type: 'Spot', dist: '38 min', time: '17:00', votes: 5 },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
              borderTop: i ? `1px solid ${MK.hairline}` : 'none' }}>
              <div className="mk-mono" style={{ fontSize: 11, color: MK.inkMute, width: 36 }}>{s.time}</div>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: s.active ? accent : MK.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name={s.type === 'Station' ? 'fuel' : 'skateboard'} size={16} color={s.active ? '#fff' : MK.ink} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{s.name}</div>
                <div className="mk-mono" style={{ fontSize: 10, color: MK.inkMute, marginTop: 1 }}>{s.type.toUpperCase()} · {s.dist}</div>
              </div>
              {s.votes !== null && (
                <div className="mk-mono" style={{ fontSize: 11, color: s.active ? accent : MK.inkSoft, fontWeight: 600 }}>{s.votes}/5</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <BottomTab active="map" tone={tone} accent={accent} />
      <HomeIndicator tone={tone} />
    </Phone>
  );
};

Object.assign(window, { Phone, TripSwitcher, HomeScreen, MapScreen, CREW_SKATE });
