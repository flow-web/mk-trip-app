// screens2.jsx — Planning, Budget, Guide screens

// ─────────────────────────────────────────────────────────────
// 3. PLANNING — timeline vertical by day
// ─────────────────────────────────────────────────────────────
const PlanningScreen = ({ tone = 'light', accent = MK.skate.base, tint = MK.skate.tint, deep = MK.skate.deep }) => {
  return (
    <Phone tone={tone}>
      <StatusBar tone="dark" />
      <TripSwitcher accent={accent} />

      {/* Day header */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="mk-eyebrow" style={{ color: MK.inkMute }}>PLANNING</div>
          <div style={{ display: 'flex', gap: 4, background: MK.sand, borderRadius: 999, padding: 3 }}>
            <div style={{ padding: '4px 10px', background: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Jour</div>
            <div style={{ padding: '4px 10px', color: MK.inkSoft, fontSize: 11, fontWeight: 500 }}>Semaine</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
          <div className="mk-display" style={{ fontSize: 44 }}>Mardi 30</div>
          <div className="mk-display-italic" style={{ fontSize: 22, color: accent }}>Jour 3</div>
        </div>
        <div style={{ fontSize: 13, color: MK.inkSoft, marginTop: 2 }}>Bayonne → Hossegor · 87 km au compteur</div>

        {/* Week strip */}
        <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
          {[
            { d: 'L', n: '28', done: true },
            { d: 'M', n: '29', done: true },
            { d: 'M', n: '30', active: true },
            { d: 'J', n: '31' },
            { d: 'V', n: '01' },
            { d: 'S', n: '02' },
            { d: 'D', n: '03' },
          ].map((day, i) => {
            const active = day.active;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 0', borderRadius: 8, background: active ? MK.ink : 'transparent',
                color: active ? '#fff' : (day.done ? MK.inkMute : MK.ink),
                border: `1px solid ${active ? MK.ink : MK.hairline}` }}>
                <div className="mk-mono" style={{ fontSize: 9, opacity: 0.7 }}>{day.d}</div>
                <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 16, marginTop: 2 }}>{day.n}</div>
                {day.done && !active && <div style={{ width: 4, height: 4, background: accent, borderRadius: '50%', marginTop: 3 }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 100px' }} className="mk-noscroll">
        {[
          { time: '09:30', dur: '1h', title: 'Café + briefing', sub: 'Le Petit Bayonne', kind: 'coffee', done: true, crew: 5 },
          { time: '11:00', dur: '3h', title: 'Skatepark de Bayonne', sub: 'Spot · Bowl béton', kind: 'skateboard', done: true, crew: 5, hero: PHOTO.skate_spot2 },
          { time: '14:30', dur: '2h', title: 'Bowl du Prado', sub: 'Spot · vidéo session', kind: 'skateboard', active: true, crew: 4, hero: PHOTO.skate_bowl },
          { time: '17:00', dur: '30min', title: 'Plein essence', sub: 'Total Hossegor', kind: 'fuel' },
          { time: '19:30', dur: '2h', title: 'Bouffe — Chez Manu', sub: 'Tapas · 28€/tête', kind: 'flame', crew: 5 },
          { time: '22:00', dur: '8h', title: 'Airbnb Hossegor', sub: '3 chambres · 4 lits', kind: 'bed' },
        ].map((ev, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, position: 'relative' }}>
            {/* Time col */}
            <div style={{ width: 48, paddingTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div className="mk-mono" style={{ fontSize: 12, fontWeight: 600, color: ev.active ? accent : MK.ink }}>{ev.time}</div>
              <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, marginTop: 2 }}>{ev.dur}</div>
            </div>
            {/* Rail */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%',
                background: ev.done ? accent : ev.active ? '#fff' : '#fff',
                border: ev.active ? `3px solid ${accent}` : `2px solid ${ev.done ? accent : MK.hairlineStrong}` }} />
              {i < 5 && <div style={{ width: 1.5, flex: 1, background: ev.done ? accent : MK.hairlineStrong, minHeight: 50 }} />}
            </div>
            {/* Card */}
            <div style={{ flex: 1, paddingTop: 8, paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon name={ev.kind} size={13} color={ev.active ? accent : MK.inkMute} stroke={2} />
                    <div className="mk-mono" style={{ fontSize: 9, color: ev.active ? accent : MK.inkMute, letterSpacing: '0.06em', fontWeight: 600 }}>
                      {ev.sub.split(' · ')[0].toUpperCase()}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em',
                    textDecoration: ev.done ? 'line-through' : 'none', textDecorationColor: 'rgba(28,26,23,.3)',
                    color: ev.done ? MK.inkMute : MK.ink }}>{ev.title}</div>
                  <div style={{ fontSize: 12, color: MK.inkSoft, marginTop: 2 }}>{ev.sub}</div>
                  {ev.crew && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <AvatarStack people={CREW_SKATE.slice(0, ev.crew)} size={18} accent={accent} />
                    </div>
                  )}
                </div>
                {ev.hero && (
                  <div style={{ width: 64, height: 64, borderRadius: 6, background: `url(${ev.hero}) center/cover`, flex: 'none', border: ev.active ? `2px solid ${accent}` : 'none' }} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating add */}
      <div style={{ position: 'absolute', bottom: 100, right: 20, width: 52, height: 52, borderRadius: 26,
        background: MK.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 16px rgba(0,0,0,.2)' }}>
        <Icon name="plus" size={22} color="#fff" />
      </div>

      <BottomTab active="plan" tone={tone} accent={accent} />
      <HomeIndicator tone={tone} />
    </Phone>
  );
};

// ─────────────────────────────────────────────────────────────
// 4. BUDGET / SPLIT
// ─────────────────────────────────────────────────────────────
const BudgetScreen = ({ tone = 'light', accent = MK.skate.base, tint = MK.skate.tint, deep = MK.skate.deep }) => {
  return (
    <Phone tone={tone}>
      <StatusBar tone="dark" />
      <TripSwitcher accent={accent} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 100px' }} className="mk-noscroll">
        <div className="mk-eyebrow" style={{ color: MK.inkMute }}>BUDGET · TOTAL DÉPENSÉ</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
          <div className="mk-display" style={{ fontSize: 48 }}>312<span style={{ fontSize: 32, color: MK.inkMute }}>,40 €</span></div>
          <div style={{ textAlign: 'right' }}>
            <div className="mk-mono" style={{ fontSize: 11, color: MK.inkMute }}>BUDGET 800 €</div>
            <div className="mk-mono" style={{ fontSize: 12, fontWeight: 600, color: accent }}>39 % consommé</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 12, height: 5, background: MK.sand, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: '39%', height: '100%', background: accent }} />
          <div style={{ position: 'absolute', left: '57%', top: -2, width: 1, height: 9, background: MK.ink, opacity: 0.4 }} />
        </div>
        <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, marginTop: 4, letterSpacing: '0.04em' }}>JOUR 3/7 — RYTHME ATTENDU 57 %</div>

        {/* Qui doit quoi à qui */}
        <div style={{ marginTop: 26 }}>
          <div className="mk-eyebrow" style={{ color: MK.inkMute }}>QUI DOIT QUOI À QUI</div>
          <div style={{ marginTop: 12, background: '#fff', borderRadius: 12, border: `1px solid ${MK.hairline}`, padding: '4px 0' }}>
            {[
              { from: 'LL', fc: '#5A6E3E', fn: 'Léa', to: 'TM', tc: '#C75A20', tn: 'Théo', amt: '32,40 €' },
              { from: 'MK', fc: '#1E3A5C', fn: 'Mika', to: 'TM', tc: '#C75A20', tn: 'Théo', amt: '48,00 €' },
              { from: 'JR', fc: '#B14E32', fn: 'Jordan', to: 'NS', tc: '#3D362C', tn: 'Naïs', amt: '15,80 €' },
            ].map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                borderTop: i ? `1px solid ${MK.hairline}` : 'none' }}>
                <Avatar name={d.from} bg={d.fc} size={28} />
                <div style={{ fontSize: 13, color: MK.inkSoft }}>{d.fn}</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <div style={{ flex: 1, height: 1, background: MK.hairlineStrong, borderTop: '1px dashed' }} />
                  <div className="mk-mono" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 6px',
                    fontSize: 13, fontWeight: 600, color: MK.ink }}>{d.amt}</div>
                  <Icon name="arrow" size={14} color={MK.inkMute} style={{ marginLeft: -4 }} />
                </div>
                <div style={{ fontSize: 13, color: MK.inkSoft, textAlign: 'right' }}>{d.tn}</div>
                <Avatar name={d.to} bg={d.tc} size={28} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, padding: '0 4px' }}>
            <div className="mk-mono" style={{ fontSize: 10, color: MK.inkMute }}>3 TRANSFERTS · 96,20 €</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: accent, fontWeight: 600 }}>
              Régler tout <Icon name="chevRight" size={14} color={accent} />
            </div>
          </div>
        </div>

        {/* Catégories */}
        <div style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="mk-eyebrow" style={{ color: MK.inkMute }}>PAR CATÉGORIE</div>
            <div style={{ fontSize: 11, color: MK.inkMute }}>Jours 1 → 3</div>
          </div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { n: 'Essence', icon: 'fuel', val: '112,20', pct: 36, c: MK.ink },
              { n: 'Hébergement', icon: 'bed', val: '98,00', pct: 31, c: accent },
              { n: 'Bouffe', icon: 'flame', val: '72,40', pct: 23, c: MK.surf.base },
              { n: 'Activité', icon: 'skateboard', val: '29,80', pct: 10, c: MK.rando.base },
            ].map((cat, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 12, border: `1px solid ${MK.hairline}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Icon name={cat.icon} size={16} color={cat.c} />
                  <div className="mk-mono" style={{ fontSize: 10, color: MK.inkMute }}>{cat.pct}%</div>
                </div>
                <div style={{ fontSize: 12, color: MK.inkSoft, marginTop: 8 }}>{cat.n}</div>
                <div className="mk-display" style={{ fontSize: 20, marginTop: 2 }}>{cat.val}<span style={{ fontSize: 12, color: MK.inkMute }}> €</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Récentes */}
        <div style={{ marginTop: 26 }}>
          <div className="mk-eyebrow" style={{ color: MK.inkMute }}>DÉPENSES RÉCENTES</div>
          <div style={{ marginTop: 12 }}>
            {[
              { who: 'TM', wc: '#C75A20', wn: 'Théo', cat: 'Essence', label: 'Plein Total', amt: '48,20', when: '11:30', icon: 'fuel', split: 'TM+4' },
              { who: 'LL', wc: '#5A6E3E', wn: 'Léa', cat: 'Bouffe', label: 'Boulangerie Aupy', amt: '23,40', when: '09:15', icon: 'flame', split: 'TM+4' },
              { who: 'MK', wc: '#1E3A5C', wn: 'Mika', cat: 'Hébergement', label: 'Airbnb Hossegor', amt: '98,00', when: 'Hier', icon: 'bed', split: 'TM+4' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderTop: i ? `1px solid ${MK.hairline}` : 'none' }}>
                <Avatar name={e.who} bg={e.wc} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{e.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Icon name={e.icon} size={10} color={MK.inkMute} stroke={2} />
                    <div className="mk-mono" style={{ fontSize: 10, color: MK.inkMute, letterSpacing: '0.04em' }}>{e.cat.toUpperCase()} · {e.when}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mk-mono" style={{ fontSize: 15, fontWeight: 600 }}>{e.amt} €</div>
                  <div className="mk-mono" style={{ fontSize: 9, color: MK.inkMute, marginTop: 1 }}>÷ 5</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating add CTA */}
      <div style={{ position: 'absolute', bottom: 100, left: 20, right: 20, height: 48, borderRadius: 999,
        background: MK.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 6px 16px rgba(0,0,0,.2)' }}>
        <Icon name="plus" size={18} color="#fff" stroke={2} />
        <div style={{ fontWeight: 600, fontSize: 15 }}>Ajouter une dépense</div>
      </div>

      <BottomTab active="split" tone={tone} accent={accent} />
      <HomeIndicator tone={tone} />
    </Phone>
  );
};

// ─────────────────────────────────────────────────────────────
// 5. GUIDE / CARNET
// ─────────────────────────────────────────────────────────────
const GuideScreen = ({ tone = 'light', accent = MK.skate.base, tint = MK.skate.tint, deep = MK.skate.deep }) => {
  const dark = tone === 'dark';
  return (
    <Phone tone={tone}>
      <StatusBar tone="dark" />
      <TripSwitcher accent={accent} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 100px' }} className="mk-noscroll">
        <div className="mk-eyebrow" style={{ color: MK.inkMute }}>CARNET</div>
        <div className="mk-display" style={{ fontSize: 44, marginTop: 4 }}>Le guide<br/><span className="mk-display-italic" style={{ color: accent, fontSize: 40 }}>du Sud-Ouest.</span></div>
        <div style={{ fontSize: 13, color: MK.inkSoft, marginTop: 8, maxWidth: 280 }}>
          Pratique, lexique, matos. Préparé pour le crew, à jour à 100 %.
        </div>

        {/* Infos pratiques — pinned tiles */}
        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { t: 'Langues', v: 'FR · ES', icon: 'book' },
            { t: 'Devise', v: 'EUR', icon: 'wallet' },
            { t: 'Urgences', v: '112', icon: 'flame', em: true },
            { t: 'Météo type', v: '22-26°', icon: 'sun' },
          ].map((tile, i) => (
            <div key={i} style={{ background: tile.em ? MK.ink : '#fff', color: tile.em ? '#fff' : MK.ink,
              borderRadius: 10, padding: 14, border: tile.em ? 'none' : `1px solid ${MK.hairline}` }}>
              <Icon name={tile.icon} size={16} color={tile.em ? accent : MK.inkMute} />
              <div style={{ fontSize: 11, color: tile.em ? 'rgba(255,255,255,.7)' : MK.inkMute, marginTop: 10 }}>{tile.t}</div>
              <div style={{ fontFamily: tile.t === 'Urgences' ? 'Geist Mono' : 'Bricolage Grotesque', fontWeight: 700, fontSize: 18, marginTop: 2, letterSpacing: '-0.01em' }}>{tile.v}</div>
            </div>
          ))}
        </div>

        {/* Checklist matos */}
        <div style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="mk-eyebrow" style={{ color: MK.inkMute }}>CHECKLIST MATOS · SKATE</div>
            <div className="mk-mono" style={{ fontSize: 11, fontWeight: 600, color: accent }}>14 / 18</div>
          </div>
          <div style={{ marginTop: 12, background: '#fff', borderRadius: 12, border: `1px solid ${MK.hairline}`, overflow: 'hidden' }}>
            {[
              { l: 'Board principale + roues de spare', who: 'TM', wc: '#C75A20', done: true },
              { l: 'Casque + genouillères', who: 'LL', wc: '#5A6E3E', done: true },
              { l: 'GoPro + 3 batteries', who: 'MK', wc: '#1E3A5C', done: true },
              { l: 'Pharmacie crew (bandes, antalgiques)', who: 'NS', wc: '#3D362C', done: false },
              { l: 'Câbles + chargeurs van', who: 'JR', wc: '#B14E32', done: false },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderTop: i ? `1px solid ${MK.hairline}` : 'none' }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, border: item.done ? 'none' : `1.5px solid ${MK.hairlineStrong}`,
                  background: item.done ? MK.ink : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.done && <Icon name="check" size={14} color="#fff" stroke={2.4} />}
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500,
                  textDecoration: item.done ? 'line-through' : 'none',
                  textDecorationColor: 'rgba(28,26,23,.4)',
                  color: item.done ? MK.inkMute : MK.ink }}>{item.l}</div>
                <Avatar name={item.who} bg={item.wc} size={22} />
              </div>
            ))}
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, color: MK.inkMute, borderTop: `1px solid ${MK.hairline}` }}>
              <Icon name="plus" size={14} color={MK.inkMute} />
              <div style={{ fontSize: 13 }}>Ajouter un item · 3 suggestions</div>
            </div>
          </div>
        </div>

        {/* Lexique placeholder */}
        <div style={{ marginTop: 26, background: tint, borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.18 }}>
            <Icon name="camera" size={120} color={deep} stroke={1.2} />
          </div>
          <div className="mk-eyebrow" style={{ color: deep }}>LEXIQUE · BIENTÔT</div>
          <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 22, color: deep, marginTop: 6, letterSpacing: '-0.02em' }}>
            Traduction caméra<br/><span className="mk-display-italic" style={{ fontWeight: 500 }}>en live.</span>
          </div>
          <div style={{ fontSize: 13, color: deep, opacity: 0.85, marginTop: 8, maxWidth: 200 }}>
            Pour les voyages à l'étranger. Pointe ton tel sur un panneau, on traduit.
          </div>
          <div style={{ display: 'inline-block', marginTop: 14, padding: '6px 12px', background: deep, color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
            Me prévenir
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginTop: 26 }}>
          <div className="mk-eyebrow" style={{ color: MK.inkMute }}>NOTES DU CREW · 4</div>
          <div style={{ marginTop: 12 }}>
            {[
              { who: 'Théo', wc: '#C75A20', t: 'Bowl du Prado : casque obligatoire au bowl deep end. Le local crew est cool si on demande.' },
              { who: 'Léa', wc: '#5A6E3E', t: 'Pâtisserie russe à Bayonne. INCONTOURNABLE. C\'est ouvert que le matin.' },
            ].map((n, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 14, border: `1px solid ${MK.hairline}`, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={n.who.substring(0,2).toUpperCase()} bg={n.wc} size={22} />
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{n.who}</div>
                  <div className="mk-mono" style={{ fontSize: 10, color: MK.inkMute, marginLeft: 'auto' }}>HIER · 18:30</div>
                </div>
                <div style={{ fontSize: 13, color: MK.inkSoft, marginTop: 8, lineHeight: 1.45 }}>{n.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomTab active="guide" tone={tone} accent={accent} />
      <HomeIndicator tone={tone} />
    </Phone>
  );
};

Object.assign(window, { PlanningScreen, BudgetScreen, GuideScreen });
