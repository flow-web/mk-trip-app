// tokens.jsx — design tokens display

const Tokens = () => {
  return (
    <div className="mk" style={{ width: 1280, height: 800, background: MK.paper, padding: 56, display: 'grid',
      gridTemplateColumns: '1.1fr 1fr 1fr', gridTemplateRows: 'auto 1fr', gap: 32 }}>
      {/* Title */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="mk-eyebrow" style={{ color: MK.skate.base }}>02 · TOKENS</div>
          <div className="mk-display" style={{ fontSize: 56, marginTop: 12 }}>Design tokens.</div>
          <div style={{ fontSize: 14, color: MK.inkSoft, marginTop: 8, maxWidth: 480 }}>
            Couleurs, typo, spacing, radius. Exportable en <span className="mk-mono" style={{ background: MK.sand, padding: '1px 6px', borderRadius: 4 }}>tailwind.config.js</span> à la demande.
          </div>
        </div>
        <div className="mk-mono" style={{ fontSize: 11, color: MK.inkMute, letterSpacing: '0.06em' }}>v0.1 · MAY 2026</div>
      </div>

      {/* COLOR — left wide */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div className="mk-eyebrow" style={{ color: MK.inkMute, marginBottom: 10 }}>NEUTRES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {[
              { n: 'paper', c: MK.paper, hex: 'F2EDE3' },
              { n: 'paperDeep', c: MK.paperDeep, hex: 'E8E0CF' },
              { n: 'sand', c: MK.sand, hex: 'DDD2BD' },
              { n: 'inkMute', c: MK.inkMute, hex: '7A6F60' },
              { n: 'inkSoft', c: MK.inkSoft, hex: '3D362C' },
              { n: 'ink', c: MK.ink, hex: '1C1A17' },
            ].map(s => (
              <div key={s.n}>
                <div style={{ height: 72, background: s.c, borderRadius: 6, border: `1px solid ${MK.hairline}` }} />
                <div style={{ fontSize: 10, fontFamily: 'Geist Mono', marginTop: 6, color: MK.inkSoft }}>{s.n}</div>
                <div style={{ fontSize: 10, fontFamily: 'Geist Mono', color: MK.inkMute }}>#{s.hex}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mk-eyebrow" style={{ color: MK.inkMute, marginBottom: 10 }}>4 ACCENTS · UN PAR TYPE DE VOYAGE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { k: 'SKATE', t: MK.skate, sym: 'skateboard' },
              { k: 'RANDO', t: MK.rando, sym: 'peak' },
              { k: 'SURF',  t: MK.surf,  sym: 'wave' },
              { k: 'CITY',  t: MK.city,  sym: 'van' },
            ].map(a => (
              <div key={a.k} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${MK.hairline}` }}>
                <div style={{ background: a.t.base, padding: '14px 12px 12px', color: '#fff' }}>
                  <Icon name={a.sym} size={20} color="#fff" />
                  <div className="mk-display" style={{ fontSize: 18, marginTop: 18 }}>{a.k}</div>
                  <div className="mk-mono" style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{a.t.base.toUpperCase()}</div>
                </div>
                <div style={{ display: 'flex', height: 18 }}>
                  <div style={{ flex: 1, background: a.t.deep }} />
                  <div style={{ flex: 1, background: a.t.tint }} />
                  <div style={{ flex: 1, background: a.t.tintDark }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mk-eyebrow" style={{ color: MK.inkMute, marginBottom: 10 }}>SPACING · 4PT</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {[4, 8, 12, 16, 20, 24, 32, 40, 48].map(n => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: n, height: n, background: MK.ink }} />
                <div className="mk-mono" style={{ fontSize: 10, color: MK.inkMute }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TYPE — middle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 24, background: '#fff', borderRadius: 8, border: `1px solid ${MK.hairline}` }}>
        <div className="mk-eyebrow" style={{ color: MK.inkMute }}>TYPOGRAPHIE</div>

        <div>
          <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, letterSpacing: '0.08em' }}>DISPLAY · BRICOLAGE GROTESQUE 800</div>
          <div className="mk-display" style={{ fontSize: 64, marginTop: 4, lineHeight: 0.9 }}>437 km</div>
        </div>

        <div style={{ borderTop: `1px solid ${MK.hairline}`, paddingTop: 16 }}>
          <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, letterSpacing: '0.08em' }}>ITALIC · BRICOLAGE 500</div>
          <div className="mk-display-italic" style={{ fontSize: 32, marginTop: 4, color: MK.skate.base }}>Jour 3 / 7</div>
        </div>

        <div style={{ borderTop: `1px solid ${MK.hairline}`, paddingTop: 16 }}>
          <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, letterSpacing: '0.08em' }}>HEADING · BRICOLAGE 700</div>
          <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', marginTop: 4 }}>Bowl du Prado</div>
        </div>

        <div style={{ borderTop: `1px solid ${MK.hairline}`, paddingTop: 16 }}>
          <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, letterSpacing: '0.08em' }}>BODY · GEIST 400 / 500</div>
          <div style={{ fontSize: 15, marginTop: 4, lineHeight: 1.45 }}>Demain : skatepark de Bayonne, départ 10h. Théo prend le van.</div>
        </div>

        <div style={{ borderTop: `1px solid ${MK.hairline}`, paddingTop: 16 }}>
          <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, letterSpacing: '0.08em' }}>MONO · GEIST MONO · CHIFFRES</div>
          <div className="mk-mono" style={{ fontSize: 16, marginTop: 4 }}>312,40 € · 1240 m D+ · J-12</div>
        </div>

        <div style={{ borderTop: `1px solid ${MK.hairline}`, paddingTop: 16 }}>
          <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, letterSpacing: '0.08em' }}>EYEBROW · MONO 10PX TRACKED</div>
          <div className="mk-eyebrow" style={{ color: MK.skate.base, fontSize: 11, marginTop: 4 }}>ROAD TRIP · SUD-OUEST · 2026</div>
        </div>
      </div>

      {/* RIGHT — radius, elevation, icons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ padding: 20, background: '#fff', borderRadius: 8, border: `1px solid ${MK.hairline}` }}>
          <div className="mk-eyebrow" style={{ color: MK.inkMute }}>RADIUS</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'flex-end' }}>
            {[
              { r: 4, n: 'xs · chip' },
              { r: 8, n: 'sm · card' },
              { r: 12, n: 'md · sheet' },
              { r: 24, n: 'lg · hero' },
              { r: 999, n: 'pill · CTA' },
            ].map(s => (
              <div key={s.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', height: 48, background: MK.ink, borderRadius: s.r }} />
                <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, textAlign: 'center' }}>{s.n}</div>
              </div>
            ))}
          </div>
          <div className="mk-mono" style={{ fontSize: 10, color: MK.inkSoft, marginTop: 14, lineHeight: 1.5 }}>
            8/12/24 par défaut · pas de pill partout · le pill se réserve aux CTA et chips
          </div>
        </div>

        <div style={{ padding: 20, background: '#fff', borderRadius: 8, border: `1px solid ${MK.hairline}` }}>
          <div className="mk-eyebrow" style={{ color: MK.inkMute }}>ÉLÉVATION</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            {[
              { s: '0 1px 2px rgba(0,0,0,.06)', n: 'flat' },
              { s: '0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04)', n: 'card' },
              { s: '0 4px 12px rgba(0,0,0,.10), 0 16px 32px rgba(0,0,0,.08)', n: 'sheet' },
            ].map(e => (
              <div key={e.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: '100%', height: 48, background: '#fff', borderRadius: 6, boxShadow: e.s }} />
                <div className="mk-mono" style={{ fontSize: 10, color: MK.inkMute }}>{e.n}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 20, background: '#fff', borderRadius: 8, border: `1px solid ${MK.hairline}`, flex: 1 }}>
          <div className="mk-eyebrow" style={{ color: MK.inkMute }}>ICONOGRAPHIE · LUCIDE 1.75 + APLATS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 14 }}>
            {['map','pin','route','calendar','clock','wallet','receipt','users','cloud','sun','mountain','flame'].map(n => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 36, height: 36, background: MK.paper, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={n} size={18} color={MK.ink} />
                </div>
                <div className="mk-mono" style={{ fontSize: 8, color: MK.inkMute }}>{n}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${MK.hairline}` }}>
            <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, letterSpacing: '0.08em', marginBottom: 10 }}>CUSTOM · APLATS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { n: 'skateboard', c: MK.skate.base },
                { n: 'peak', c: MK.rando.base },
                { n: 'wave', c: MK.surf.base },
                { n: 'van', c: MK.city.base },
              ].map(p => (
                <div key={p.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 36, height: 36, background: MK.paper, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={p.n} size={20} color={p.c} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Tokens });
