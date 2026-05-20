// variants.jsx — Dark Home, Desktop Home, 3 Home variants by trip type, Components

// ─────────────────────────────────────────────────────────────
// Home — DARK mode
// ─────────────────────────────────────────────────────────────
const HomeDark = () => {
  const accent = MK.skate.base;
  return (
    <div className="mk mk-noscroll" style={{
      width: 375, height: 812, background: MK.paperDark,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', color: MK.inkDark,
    }}>
      <StatusBar tone="light" />

      <div style={{ position: 'relative', height: 320, marginTop: -50, background: `url(${PHOTO.skate_hero}) center/cover` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(22,20,15,.4) 0%, rgba(22,20,15,0) 38%, rgba(22,20,15,0) 50%, rgba(22,20,15,1) 100%)' }} />
        <div style={{ position: 'absolute', top: 50, left: 0, right: 0 }}>
          <TripSwitcher tone="dark" accent="rgba(255,255,255,.15)" label="Sud-Ouest" sublabel="Skate · 5 potes" />
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18, color: '#fff' }}>
          <div className="mk-eyebrow" style={{ color: 'rgba(255,255,255,.85)' }}>ROAD TRIP · 28 MAI → 4 JUIN</div>
          <div className="mk-display" style={{ fontSize: 44, marginTop: 8, color: '#fff' }}>Bayonne /{'\n'}Bordeaux</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
            <div style={{ background: accent, color: '#fff', padding: '6px 10px', borderRadius: 4 }}>
              <div className="mk-display-italic" style={{ fontSize: 16 }}>JOUR 3 / 7</div>
            </div>
            <div className="mk-mono" style={{ fontSize: 13, color: '#fff' }}>437 km · 8/14 spots</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }} className="mk-noscroll">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div className="mk-eyebrow" style={{ color: MK.inkMuteDark }}>À VENIR · AUJOURD'HUI</div>
            <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 22, marginTop: 4, color: MK.inkDark }}>Encore 3 choses.</div>
          </div>
          <Icon name="chevRight" size={20} color={MK.inkMuteDark} />
        </div>

        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginLeft: -20, paddingLeft: 20, marginRight: -20, paddingRight: 20 }} className="mk-noscroll">
          <div style={{ width: 220, flex: 'none', background: MK.paperDarkDeep, borderRadius: 12, border: `1px solid ${MK.hairlineDark}`, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, background: accent, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="skateboard" size={12} color="#fff" />
              </div>
              <div className="mk-mono" style={{ fontSize: 10, color: MK.inkMuteDark, letterSpacing: '0.04em' }}>PROCHAIN SPOT · 14:30</div>
            </div>
            <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 19, marginTop: 10, color: MK.inkDark }}>Bowl du Prado</div>
            <div style={{ fontSize: 12, color: MK.inkMuteDark, marginTop: 2 }}>Marseille · 12 min</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <AvatarStack people={CREW_SKATE.slice(0, 4)} size={22} dark accent={accent} />
              <div className="mk-mono" style={{ fontSize: 11, color: accent, fontWeight: 600 }}>4 / 5 OK</div>
            </div>
          </div>
          <div style={{ width: 200, flex: 'none', background: accent, color: '#fff', borderRadius: 12, padding: 14 }}>
            <div className="mk-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,.75)' }}>À RÉGLER · -2 J</div>
            <div className="mk-display" style={{ fontSize: 28, marginTop: 12 }}>48,20 €</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Plein essence</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
              <Avatar name="TM" bg="rgba(255,255,255,.25)" size={20} />
              <div style={{ fontSize: 12, opacity: 0.9 }}>Théo a avancé</div>
            </div>
          </div>
          <div style={{ width: 180, flex: 'none', background: MK.skate.tintDark, borderRadius: 12, padding: 14, border: `1px solid ${MK.hairlineDark}` }}>
            <div className="mk-mono" style={{ fontSize: 10, color: MK.skate.base, letterSpacing: '0.04em' }}>MÉTÉO · BAYONNE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 12, gap: 6 }}>
              <div className="mk-display" style={{ fontSize: 38, color: MK.inkDark }}>24°</div>
              <Icon name="sun" size={20} color={accent} />
            </div>
            <div style={{ fontSize: 12, color: MK.inkSoftDark, marginTop: 4 }}>Soleil · vent 12 km/h</div>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <div className="mk-eyebrow" style={{ color: MK.inkMuteDark }}>LE CREW EN CHIFFRES</div>
          <div style={{ marginTop: 12, background: MK.paperDarkDeep, borderRadius: 12, border: `1px solid ${MK.hairlineDark}`, overflow: 'hidden' }}>
            {[
              { label: 'km parcourus', val: '437', unit: 'km' },
              { label: 'spots faits', val: '8 / 14' },
              { label: 'budget', val: '312 €', unit: '/ 800' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                padding: '14px 16px', borderTop: i ? `1px solid ${MK.hairlineDark}` : 'none' }}>
                <div style={{ fontSize: 13, color: MK.inkSoftDark }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <div className="mk-display" style={{ fontSize: 22, color: MK.inkDark }}>{s.val}</div>
                  {s.unit && <div className="mk-mono" style={{ fontSize: 11, color: MK.inkMuteDark }}>{s.unit}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { n: 'receipt', l: 'Dépense' },
            { n: 'pin', l: 'Spot' },
            { n: 'calendar', l: 'Jour' },
          ].map((q, i) => (
            <div key={i} style={{ background: MK.paperDarkDeep, border: `1px solid ${MK.hairlineDark}`, borderRadius: 12, padding: '14px 12px' }}>
              <div style={{ width: 30, height: 30, background: MK.sandDark, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={q.n} size={16} color={MK.inkDark} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 8, color: MK.inkDark }}>{q.l}</div>
            </div>
          ))}
        </div>
      </div>

      <BottomTab active="home" tone="dark" accent={accent} />
      <HomeIndicator tone="dark" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Home — DESKTOP (1280)
// ─────────────────────────────────────────────────────────────
const HomeDesktop = () => {
  const accent = MK.skate.base;
  return (
    <div className="mk" style={{ width: 1280, height: 800, background: MK.paper, display: 'flex', overflow: 'hidden' }}>
      {/* Left rail */}
      <div style={{ width: 240, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24, borderRight: `1px solid ${MK.hairline}`, flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: MK.ink, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: 18, color: MK.paper, letterSpacing: '-0.05em' }}>MK</div>
          </div>
          <div className="mk-display" style={{ fontSize: 20 }}>Trip</div>
        </div>

        {/* Trips list */}
        <div>
          <div className="mk-eyebrow" style={{ color: MK.inkMute, marginBottom: 8 }}>VOYAGES · 4</div>
          {[
            { l: 'Sud-Ouest', t: 'Skate · 5 potes', c: MK.skate.base, icon: 'skateboard', active: true },
            { l: 'GR20 Corse', t: 'Rando · 3 amis', c: MK.rando.base, icon: 'peak' },
            { l: 'Lisboa', t: 'City · couple', c: MK.city.base, icon: 'van' },
            { l: 'Hossegor automne', t: 'Surf · 4 potes', c: MK.surf.base, icon: 'wave' },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 8,
              background: t.active ? '#fff' : 'transparent', border: t.active ? `1px solid ${MK.hairline}` : 'none', marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, background: t.c, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon name={t.icon} size={14} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: t.active ? 600 : 500, color: MK.ink }}>{t.l}</div>
                <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, letterSpacing: '0.04em' }}>{t.t.toUpperCase()}</div>
              </div>
              {t.active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.c }} />}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px', color: MK.inkMute, fontSize: 13 }}>
            <Icon name="plus" size={14} color={MK.inkMute} />
            <div>Nouveau voyage</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { n: 'home', l: 'Home', active: true },
            { n: 'map', l: 'Map' },
            { n: 'calendar', l: 'Planning' },
            { n: 'wallet', l: 'Split' },
            { n: 'book', l: 'Guide' },
          ].map((nav, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 6,
              background: nav.active ? MK.paperDeep : 'transparent', color: nav.active ? MK.ink : MK.inkSoft }}>
              <Icon name={nav.n} size={16} color={nav.active ? accent : MK.inkSoft} />
              <div style={{ fontSize: 13, fontWeight: nav.active ? 600 : 500 }}>{nav.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Hero */}
        <div style={{ height: 320, position: 'relative', background: `url(${PHOTO.skate_hero}) center/cover`, flex: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,.7) 100%)' }} />
          <div style={{ position: 'absolute', left: 40, bottom: 28, right: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', color: '#fff' }}>
            <div>
              <div className="mk-eyebrow" style={{ color: 'rgba(255,255,255,.85)' }}>ROAD TRIP · 28 MAI → 4 JUIN · 2026</div>
              <div className="mk-display" style={{ fontSize: 88, marginTop: 12, lineHeight: 0.9 }}>Bayonne /<br/>Bordeaux<span style={{ color: accent }}>.</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18 }}>
                <div style={{ background: accent, padding: '6px 12px', borderRadius: 4 }}>
                  <div className="mk-display-italic" style={{ fontSize: 18, color: '#fff' }}>JOUR 3 / 7</div>
                </div>
                <AvatarStack people={CREW_SKATE} size={28} accent={MK.ink} />
                <div className="mk-mono" style={{ fontSize: 14 }}>5 · le crew</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mk-mono" style={{ fontSize: 11, opacity: 0.85, letterSpacing: '0.06em' }}>POSITION ACTUELLE</div>
              <div style={{ fontFamily: 'Bricolage Grotesque', fontStyle: 'italic', fontWeight: 500, fontSize: 22, marginTop: 4 }}>Marseille</div>
              <div className="mk-mono" style={{ fontSize: 11, opacity: 0.8 }}>43.296°N · 5.370°E</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 32, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, overflow: 'hidden' }}>
          {/* Left: stats + next spots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <div>
              <div className="mk-eyebrow" style={{ color: MK.inkMute }}>LE CREW EN CHIFFRES</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12 }}>
                {[
                  { l: 'km parcourus', v: '437', u: 'km' },
                  { l: 'spots faits', v: '8/14' },
                  { l: 'budget', v: '312€', s: 'sur 800' },
                  { l: 'jours restants', v: '4', u: 'j' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 14, border: `1px solid ${MK.hairline}` }}>
                    <div style={{ fontSize: 11, color: MK.inkMute }}>{s.l}</div>
                    <div className="mk-display" style={{ fontSize: 28, marginTop: 8 }}>{s.v}<span style={{ fontSize: 14, color: MK.inkMute }}>{s.u && ` ${s.u}`}</span></div>
                    {s.s && <div className="mk-mono" style={{ fontSize: 10, color: MK.inkMute, marginTop: 2 }}>{s.s.toUpperCase()}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* À venir */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="mk-eyebrow" style={{ color: MK.inkMute }}>À VENIR · AUJOURD'HUI</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: MK.inkSoft }}>Tout voir <Icon name="chevRight" size={14} color={MK.inkSoft} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.9fr', gap: 10, marginTop: 12 }}>
                <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${MK.hairline}`, padding: 16, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: -10, top: -10, opacity: 0.06 }}>
                    <Icon name="skateboard" size={80} color={accent} />
                  </div>
                  <div className="mk-mono" style={{ fontSize: 10, color: MK.inkMute }}>PROCHAIN SPOT · 14:30</div>
                  <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 22, marginTop: 12 }}>Bowl du Prado</div>
                  <div style={{ fontSize: 12, color: MK.inkSoft, marginTop: 4 }}>Marseille · 12 min de route</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
                    <AvatarStack people={CREW_SKATE.slice(0,4)} size={20} accent={accent} />
                    <div className="mk-mono" style={{ fontSize: 11, color: accent, fontWeight: 600 }}>4 / 5 OK</div>
                  </div>
                </div>
                <div style={{ background: MK.ink, color: '#fff', borderRadius: 10, padding: 16 }}>
                  <div className="mk-mono" style={{ fontSize: 10, color: 'rgba(242,237,227,.6)' }}>À RÉGLER</div>
                  <div className="mk-display" style={{ fontSize: 28, marginTop: 12, color: '#fff' }}>48,20€</div>
                  <div style={{ fontSize: 12, color: 'rgba(242,237,227,.85)', marginTop: 2 }}>Plein essence · Théo</div>
                </div>
                <div style={{ background: MK.skate.tint, borderRadius: 10, padding: 16, color: MK.skate.deep }}>
                  <div className="mk-mono" style={{ fontSize: 10 }}>MÉTÉO</div>
                  <div className="mk-display" style={{ fontSize: 32, marginTop: 12 }}>24°</div>
                  <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>Soleil · 12 km/h</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: mini map preview + actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <div style={{ background: '#EDE6D5', borderRadius: 10, height: 220, position: 'relative', overflow: 'hidden', border: `1px solid ${MK.hairline}` }}>
              <svg width="100%" height="100%" viewBox="0 0 360 220" style={{ position: 'absolute', inset: 0 }}>
                <path d="M -20 100 Q 100 70, 200 95 T 380 100" fill="none" stroke={MK.surf.base} strokeWidth="1.5" opacity="0.3"/>
                <path d="M 50 30 Q 80 70, 130 90 T 220 150 Q 240 175, 280 190" fill="none" stroke={MK.ink} strokeWidth="2" strokeDasharray="2 6"/>
              </svg>
              {[{x:50,y:30,a:false},{x:130,y:90,a:false},{x:220,y:150,a:true},{x:280,y:190,a:false}].map((p,i)=>(
                <div key={i} style={{ position: 'absolute', left: p.x-10, top: p.y-12, width: 20, height: 20, borderRadius: '50% 50% 50% 0', background: p.a?accent:MK.ink, transform: 'rotate(-45deg)', border: '2px solid #fff' }} />
              ))}
              <div style={{ position: 'absolute', left: 16, top: 14 }}>
                <div className="mk-eyebrow" style={{ color: MK.inkSoft }}>L'ITINÉRAIRE</div>
                <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 16, marginTop: 2 }}>14 spots · 437 km</div>
              </div>
              <div style={{ position: 'absolute', right: 12, bottom: 12, background: '#fff', borderRadius: 4, padding: '6px 10px', fontSize: 11, fontWeight: 600, color: MK.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                Ouvrir la map <Icon name="arrow" size={12} color={MK.ink} />
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { n: 'receipt', l: 'Dépense' },
                { n: 'pin', l: 'Spot' },
                { n: 'calendar', l: 'Jour' },
              ].map((q, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${MK.hairline}`, borderRadius: 8, padding: '12px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name={q.n} size={14} color={MK.ink} />
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{q.l}</div>
                  <Icon name="plus" size={12} color={MK.inkMute} style={{ marginLeft: 'auto' }} />
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: `1px solid ${MK.hairline}`, flex: 1 }}>
              <div className="mk-eyebrow" style={{ color: MK.inkMute }}>NOTE ÉPINGLÉE · LÉA</div>
              <div style={{ fontSize: 13, color: MK.inkSoft, marginTop: 8, lineHeight: 1.45 }}>
                "Pâtisserie russe à Bayonne. INCONTOURNABLE. C'est ouvert que le matin."
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <Avatar name="LL" bg="#5A6E3E" size={20} />
                <div className="mk-mono" style={{ fontSize: 10, color: MK.inkMute }}>HIER · 18:30</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Home — RANDO variant (GR20 Corse, 3 amis, accent vert mousse)
// ─────────────────────────────────────────────────────────────
const HomeRando = () => (
  <HomeScreen
    tone="light"
    accent={MK.rando.base}
    tint={MK.rando.tint}
    deep={MK.rando.deep}
    trip={{
      label: 'GR20', sub: 'Rando · 3 amis', dot: MK.rando.base, photo: PHOTO.rando_hero,
      eyebrow: 'GR20 · 12 → 27 JUIN · CORSE',
      display: 'Calenzana /\nConca',
      metaLeft: 'ÉTAPE 4 / 16', metaRight: '32 km',
      nextSpot: { name: 'Refuge Carrozzu', time: '17:00', sub: '1270 m · 4 h marche restante' },
      expense: { who: 'Sam', amount: '24,80 €', label: 'Ravito Calenzana' },
      weather: { temp: '18°', cond: 'Soleil voilé · vent 22 km/h' },
      stats: [
        { label: 'km parcourus', val: '32', unit: 'km' },
        { label: 'D+ accumulé', val: '4 240', unit: 'm' },
        { label: 'refuges', val: '4 / 16' },
      ],
    }}
  />
);

// ─────────────────────────────────────────────────────────────
// Home — CITY variant (Lisbonne, couple, terracotta)
// ─────────────────────────────────────────────────────────────
const HomeCity = () => (
  <HomeScreen
    tone="light"
    accent={MK.city.base}
    tint={MK.city.tint}
    deep={MK.city.deep}
    trip={{
      label: 'Lisboa', sub: 'City · couple', dot: MK.city.base, photo: PHOTO.city_hero,
      eyebrow: 'CITY BREAK · 5 → 9 JUIN',
      display: 'Lisboa,\ncinco dias.',
      metaLeft: 'JOUR 2 / 5', metaRight: '14 km à pied',
      nextSpot: { name: 'Time Out Market', time: '13:30', sub: 'Cais do Sodré · 8 min à pied' },
      expense: { who: 'Camille', amount: '32,50 €', label: 'Tram + restaurants' },
      weather: { temp: '26°', cond: 'Plein soleil · brise océan' },
      stats: [
        { label: 'km à pied', val: '14', unit: 'km' },
        { label: 'spots faits', val: '6 / 12' },
        { label: 'budget', val: '218 €', unit: '/ 600' },
      ],
    }}
  />
);

// ─────────────────────────────────────────────────────────────
// Detailed components — isolated cards
// ─────────────────────────────────────────────────────────────
const SpotCardDetail = () => (
  <div className="mk" style={{ width: 320, height: 380, background: MK.paper, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div className="mk-eyebrow" style={{ color: MK.inkMute }}>SPOT CARD</div>
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${MK.hairline}`, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 130, background: `url(${PHOTO.skate_bowl}) center/cover`, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(28,26,23,.85)', color: '#fff', borderRadius: 4, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="skateboard" size={11} color="#fff" />
          <div className="mk-mono" style={{ fontSize: 10, letterSpacing: '0.06em', fontWeight: 600 }}>SPOT</div>
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,.95)', borderRadius: 4, padding: '3px 8px', fontSize: 10, fontWeight: 600, fontFamily: 'Geist Mono' }}>14:30</div>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div>
          <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em' }}>Bowl du Prado</div>
          <div style={{ fontSize: 12, color: MK.inkMute, marginTop: 2 }}>Marseille · 12 min de route</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Geist Mono', fontSize: 11, color: MK.inkSoft }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={12} color={MK.inkMute} /> 2 h</div>
          <div style={{ width: 1, height: 10, background: MK.hairlineStrong }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="users" size={12} color={MK.inkMute} /> 4 / 5</div>
          <div style={{ width: 1, height: 10, background: MK.hairlineStrong }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="cloud" size={12} color={MK.inkMute} /> 24°</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AvatarStack people={CREW_SKATE.slice(0,4)} size={22} accent={MK.skate.base} />
          <div style={{ background: MK.skate.base, color: '#fff', borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 600 }}>+ Y aller</div>
        </div>
      </div>
    </div>
  </div>
);

const ExpenseRowDetail = () => (
  <div className="mk" style={{ width: 320, height: 380, background: MK.paper, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div className="mk-eyebrow" style={{ color: MK.inkMute }}>EXPENSE ROW · 3 ÉTATS</div>
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${MK.hairline}`, overflow: 'hidden' }}>
      {[
        { state: 'normal', who: 'TM', wc: '#C75A20', wn: 'Théo', cat: 'Essence', label: 'Plein Total', amt: '48,20', when: '11:30', icon: 'fuel' },
        { state: 'pending', who: 'LL', wc: '#5A6E3E', wn: 'Léa', cat: 'Bouffe', label: 'À catégoriser…', amt: '23,40', when: 'Maintenant', icon: 'spark' },
        { state: 'settled', who: 'MK', wc: '#1E3A5C', wn: 'Mika', cat: 'Hébergement', label: 'Airbnb Hossegor', amt: '98,00', when: 'Hier', icon: 'bed' },
      ].map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
          borderTop: i ? `1px solid ${MK.hairline}` : 'none',
          background: e.state === 'pending' ? MK.skate.tint : 'transparent',
          opacity: e.state === 'settled' ? 0.55 : 1 }}>
          <Avatar name={e.who} bg={e.wc} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              {e.label}
              {e.state === 'settled' && <Icon name="check" size={11} color={MK.ok} stroke={2.4} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <Icon name={e.icon} size={9} color={MK.inkMute} stroke={2} />
              <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, letterSpacing: '0.04em' }}>{e.cat.toUpperCase()} · {e.when.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mk-mono" style={{ fontSize: 14, fontWeight: 600, textDecoration: e.state === 'settled' ? 'line-through' : 'none' }}>{e.amt} €</div>
            <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, marginTop: 1 }}>÷ 5</div>
          </div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, letterSpacing: '0.06em' }}>LÉGENDE</div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: MK.inkSoft }}>
        <div>· Normal</div>
        <div style={{ color: MK.skate.deep }}>· À catégoriser</div>
        <div style={{ color: MK.inkMute }}>· Réglé</div>
      </div>
    </div>
  </div>
);

const MapPinDetail = () => (
  <div className="mk" style={{ width: 320, height: 380, background: MK.paper, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div className="mk-eyebrow" style={{ color: MK.inkMute }}>MAP PIN · PAR CATÉGORIE</div>
    <div style={{ background: '#EDE6D5', borderRadius: 12, padding: 24, flex: 1, position: 'relative', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 280 280" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="grid2" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid2)"/>
      </svg>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, justifyItems: 'center', alignItems: 'center', height: '100%' }}>
        {[
          { kind: 'skateboard', c: MK.skate.base, l: 'Spot' },
          { kind: 'bed', c: MK.surf.base, l: 'Hébergement' },
          { kind: 'flame', c: MK.city.base, l: 'Bouffe' },
          { kind: 'fuel', c: MK.ink, l: 'Station' },
          { kind: 'peak', c: MK.rando.base, l: 'Point haut' },
          { kind: 'coffee', c: MK.city.deep, l: 'Café' },
          { kind: 'wave', c: MK.surf.base, l: 'Spot surf' },
          { kind: 'camera', c: MK.inkSoft, l: 'Photo' },
        ].map((p, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50% 50% 50% 0', background: p.c,
              transform: 'rotate(-45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,.2)', border: '2px solid #fff' }}>
              <div style={{ transform: 'rotate(45deg)' }}>
                <Icon name={p.kind} size={14} color="#fff" />
              </div>
            </div>
            <div className="mk-mono" style={{ fontSize: 8, color: MK.inkSoft, letterSpacing: '0.04em', marginTop: 2 }}>{p.l.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
    {/* Active state */}
    <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${MK.hairline}` }}>
      <div style={{ width: 28, height: 28, borderRadius: '50% 50% 50% 0', background: MK.skate.base,
        transform: 'rotate(-45deg) scale(1.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(199,90,32,.4)', border: '2px solid #fff' }}>
        <div style={{ transform: 'rotate(45deg)' }}>
          <Icon name="skateboard" size={12} color="#fff" />
        </div>
      </div>
      <div style={{ fontSize: 11 }}>
        <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, letterSpacing: '0.04em' }}>ÉTAT ACTIF</div>
        <div style={{ fontWeight: 500 }}>+15 % · ombre teintée accent</div>
      </div>
    </div>
  </div>
);

Object.assign(window, { HomeDark, HomeDesktop, HomeRando, HomeCity, SpotCardDetail, ExpenseRowDetail, MapPinDetail });
