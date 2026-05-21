// moodboard.jsx — direction artistique screen

const Moodboard = () => {
  const photos = [
    { src: PHOTO.skate_hero, label: 'BÉTON', sub: 'Skate / Sud-Ouest' },
    { src: PHOTO.rando_hero, label: 'GRANIT', sub: 'Rando / GR20' },
    { src: PHOTO.surf_hero, label: 'OCÉAN', sub: 'Surf / Atlantique' },
    { src: PHOTO.city_hero, label: 'PASTEL', sub: 'City / Lisboa' },
  ];

  return (
    <div className="mk" style={{ width: 1280, height: 800, background: MK.paper, display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* LEFT — manifesto */}
      <div style={{ width: 460, padding: '56px 48px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${MK.hairline}` }}>
        <div className="mk-eyebrow" style={{ color: MK.skate.base }}>MK Trip · 01 · Direction</div>
        <div className="mk-display" style={{ fontSize: 76, color: MK.ink, marginTop: 24, lineHeight: 0.88 }}>
          Le carnet<br/>de bord<br/><span className="mk-display-italic" style={{ color: MK.skate.base, fontSize: 78 }}>du crew.</span>
        </div>
        <p style={{ marginTop: 28, fontSize: 15, lineHeight: 1.55, color: MK.inkSoft, maxWidth: 340 }}>
          Éditorial sport, terreux, confiant. La photo plein cadre comme matière.
          Les chiffres comptent — kilomètres, dénivelé, qui doit quoi à qui.
          Quatre voyages, quatre accents. Un seul squelette.
        </p>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="mk-eyebrow" style={{ color: MK.inkMute }}>RÉFÉRENCES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Tracksmith', 'Patagonia', 'Arc\'teryx', 'Strava', 'On Running'].map(n => (
              <div key={n} style={{ padding: '5px 10px', border: `1px solid ${MK.hairlineStrong}`, borderRadius: 999,
                fontSize: 11, color: MK.inkSoft, fontWeight: 500, letterSpacing: '0.02em' }}>{n}</div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — photo grid + tokens preview */}
      <div style={{ flex: 1, padding: 32, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: '1fr 1fr auto', gap: 14 }}>
        {photos.map((p, i) => (
          <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: `url(${p.src}) center/cover`,
            boxShadow: '0 1px 3px rgba(0,0,0,.12)' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,.55) 100%)' }} />
            <div style={{ position: 'absolute', left: 16, bottom: 14, color: '#fff' }}>
              <div className="mk-eyebrow" style={{ opacity: 0.85 }}>{p.sub}</div>
              <div className="mk-display" style={{ fontSize: 36, marginTop: 4 }}>{p.label}</div>
            </div>
          </div>
        ))}

        {/* bottom strip — palette + type pairing */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
          {/* Palette */}
          <div style={{ background: '#fff', borderRadius: 8, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, border: `1px solid ${MK.hairline}` }}>
            <div className="mk-eyebrow" style={{ color: MK.inkMute }}>PALETTE · 4 ACCENTS</div>
            <div style={{ display: 'flex', gap: 0, height: 56, borderRadius: 6, overflow: 'hidden' }}>
              {[
                { c: MK.paper, n: 'Sable', d: '#1C1A17' },
                { c: MK.ink, n: 'Charbon', d: '#fff' },
                { c: MK.skate.base, n: 'Skate', d: '#fff' },
                { c: MK.rando.base, n: 'Rando', d: '#fff' },
                { c: MK.surf.base, n: 'Surf', d: '#fff' },
                { c: MK.city.base, n: 'City', d: '#fff' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, background: s.c, color: s.d, display: 'flex', alignItems: 'flex-end', padding: 8,
                  fontSize: 10, fontFamily: 'Geist Mono, monospace', fontWeight: 500, letterSpacing: '0.04em' }}>
                  {s.n}
                </div>
              ))}
            </div>
          </div>
          {/* Type pairing */}
          <div style={{ background: MK.ink, color: MK.paper, borderRadius: 8, padding: 18, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden' }}>
            <div className="mk-eyebrow" style={{ color: 'rgba(242,237,227,.6)' }}>TYPE</div>
            <div className="mk-display" style={{ fontSize: 32, color: MK.paper }}>Bricolage</div>
            <div className="mk-display-italic" style={{ fontSize: 22, color: MK.skate.base, marginTop: -4 }}>Display Italic</div>
            <div style={{ fontFamily: 'Geist Mono', fontSize: 11, color: 'rgba(242,237,227,.7)', marginTop: 4, letterSpacing: '0.05em' }}>
              GEIST · 437 KM · 1240 M D+ · 312 €
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Moodboard });
