# MK Trip — Vision Produit & Catalogue de Features

**Date :** 2026-05-24
**Statut :** Validé (brainstorming)
**Scope :** Vision produit globale, pas un sous-projet d'implémentation

---

## Proposition de valeur

L'app qui remplace WhatsApp + Maps + Splitwise + Google Photos + Spotify pour les voyages en groupe. Couvre tout le cycle : **planifier → vivre → se souvenir → recommencer**.

## Cibles utilisateurs

- Groupes d'amis (20-30 ans) : road trips, weekends, city breaks
- Passionnés/sportifs : motards, skateurs, surfeurs, randonneurs, urbexeurs
- Couples / duos : voyages intimes et organisés
- Voyageurs réguliers (40-75 ans) : voyages variés tout au long de l'année

## Business model

- App **gratuite** dans son usage global
- Features niche/avancées **payantes** : playlist connectée, album intelligent, montage IA, replay animé, segments avancés

## Cadre privé

L'app est actuellement **cadré cercle fermé** (personnel / famille / amis). Pas de communauté publique, pas de feed social ouvert. Cette décision peut évoluer mais uniquement sur décision explicite du fondateur.

---

## Framework : 4 couches

| Couche | Quand | Rôle |
|---|---|---|
| **AVANT** | Planification | Créer le trip, inviter, choisir spots/logement/billets, voter, checklist |
| **PENDANT** | Temps réel | GPS/segments, musique partagée, coordination, photos live, dépenses |
| **APRÈS** | Souvenirs | Album commun, montage auto, stats du voyage, partage au groupe |
| **CERCLE** | Toujours | Profil voyageur, spots entre amis, templates perso, historique de trips |

Boucle de rétention :

```
AVANT (planifier) → PENDANT (vivre) → APRÈS (se souvenir)
         ↑                                       ↓
         └────── CERCLE (recommencer) ←──────────┘
```

---

## Catalogue complet — 27 features, 5 vagues

### Vague 1 — Socle (rend l'app utilisable pour un vrai trip)

S'appuie sur l'existant : map shell, planning par jour, spots, segments GPS.

| # | Feature | Couche | Effort | Description |
|---|---|---|---|---|
| 1 | **Chat intégré au trip** | PENDANT | M | Messages dans le contexte du trip. Channels auto : général, dépenses, photos. Les photos envoyées alimentent l'album. Remplace le groupe WhatsApp. |
| 2 | **Split dépenses (MVP)** | PENDANT | M | Photo ticket → OCR montant → split entre les présents en 1 tap. Calcul auto "qui doit combien à qui" en fin de trip. Pas d'API bancaire (Revolut/Powens = V2). |
| 3 | **Votes de groupe** | AVANT | S | Swipe type Tinder sur activités/restos/logements proposés par les membres. Majority wins, résultat visible en temps réel. Résout le "on fait quoi demain ?". |
| 4 | **Budget prévisionnel** | AVANT | S | Fixer un budget par personne. L'app cumule les coûts estimés au fur et à mesure (spots, logement, transport). Alerte si dépassement. |
| 5 | **Check-in aux spots** | PENDANT | S | "Je suis arrivé !" en un tap sur un spot planifié. Le groupe voit la progression de chacun sur l'itinéraire du jour. |

### Vague 2 — Différenciateurs (le "wow")

| # | Feature | Couche | Effort | Payant | Description |
|---|---|---|---|---|---|
| 6 | **Sessions rapides** | PENDANT | M | Non | Créer une session en 1 tap. Code lobby (4 chars), les potes rejoignent. Direct : GPS groupe + musique + photos. Pour les sorties improvisées auto/moto. |
| 7 | **Playlist partagée** | PENDANT | M | Oui | File d'attente collaborative via Spotify API (MVP). Chacun ajoute des morceaux, vote pour remonter un titre. Jukebox de groupe. Deezer/Apple Music en V2. |
| 8 | **Mode conduite** | PENDANT | M | Non | UI simplifiée gros boutons : next spot, skip musique, photo rapide, dépense rapide. Compatible intercom moto et autoradio Bluetooth. |
| 9 | **Timeline automatique** | APRÈS | M | Non | Journal auto-généré : trace GPS sur carte + photos géotaggées + spots visités + dépenses. L'app raconte ton voyage sans que tu écrives rien. |
| 10 | **Stats du voyage** | APRÈS | S | Non | Dashboard fin de trip : km parcourus, spots visités, dépenses total/par personne, temps de route, photos prises, records segments. |
| 11 | **Mode convoi** | PENDANT | M | Non | Positions de tout le groupe sur la carte en temps réel. Pas compétitif (≠ segments), juste "où sont les autres". Essentiel pour multi-véhicules. |

### Vague 3 — Rétention (ramène entre les trips)

| # | Feature | Couche | Effort | Description |
|---|---|---|---|---|
| 12 | **Cercles d'amis** | CERCLE | L | Groupes permanents hors trip ("Cercle skate", "Famille"). Dans un cercle : lancer un vote "prochain voyage ?", partager spots, voir les trips passés. |
| 13 | **Profil voyageur / badges** | CERCLE | M | Stats cumulées : km total, pays visités, trips faits, segments. Badges ("Premier 1000 km", "5 trips", "Noctambule"). Partagés avec les amis, pas publics. |
| 14 | **Historique de trips** | CERCLE | S | Tous les voyages passés consultables avec album, stats, timeline, playlist. Passeport digital qui accumule de la valeur. |
| 15 | **Spots entre amis** | CERCLE | M | Spots épinglés (urbex, vues, restos, fumeurs, couples...) partagés avec tes cercles, pas avec le monde. |
| 16 | **"Prochain voyage ?"** | CERCLE | S | Sondage depuis un cercle : destination, dates, budget (Doodle intégré). Si le vote aboutit → créer le trip en 1 tap. La boucle APRÈS → AVANT. |
| 17 | **Recommandations entre proches** | CERCLE | M | "Tu pars à Barcelone ? Marie y est allée en mars, regarde ses spots." Suggestion auto des trips pertinents du cercle. |

### Vague 4 — Premium / Monétisation

| # | Feature | Couche | Effort | Description |
|---|---|---|---|---|
| 18 | **Montage IA vidéo** | APRÈS | XL | Sélection auto des meilleurs moments (photos + vidéos), musique, transitions, export vidéo. Feature payante flagship. |
| 19 | **Album intelligent** | APRÈS | L | Photos auto-triées par jour, par spot, par personne (détection visages côté client). Filtrage "toutes les photos du jour 3". |
| 20 | **Replay animé du trip** | APRÈS | L | Animation trace GPS du groupe sur la carte, photos qui apparaissent au fil du trajet. "Year in review" version voyage. Exportable en vidéo → viralité. |
| 21 | **Export PDF souvenir** | APRÈS | S | Exporter le trip en PDF : itinéraire + photos + stats. Livrable tangible, partageable avec la famille. |
| 22 | **Playlist souvenir figée** | APRÈS | S | La playlist du trip devient un souvenir consultable, liée à l'album photo et à la timeline. |

### Vague 5 — Enrichissements (V2+)

| # | Feature | Couche | Effort | Description |
|---|---|---|---|---|
| 23 | **Espace logement** | AVANT | S | Espace structuré par nuit : lien Airbnb/Booking, adresse, prix, vote du groupe. Centralise une info qui finit dans WhatsApp. |
| 24 | **Comparateur billets** | AVANT | S | Espace pour coller les options vols/trains, comparer prix/horaires, voter. Pas de réservation in-app. |
| 25 | **Alertes contextuelles** | PENDANT | M | "Spot de Paul à 800m", "Pause recommandée (2h de route)", "Le resto ferme dans 30 min". App proactive. |
| 26 | **Météo embarquée** | PENDANT | S | Météo du jour par spot planifié. Alerte si conditions défavorables (pluie sur skatepark outdoor, vent pour rando). |
| 27 | **Rôles dans le trip** | AVANT | S | Assigner organisateur, trésorier, DJ, photographe. Chaque rôle débloque des raccourcis UI pertinents. |

---

## Intégration avec le backlog existant (Wanderlog)

Les sous-projets Wanderlog (B-F) s'intègrent dans les vagues :

| Sous-projet Wanderlog | Vague | Rattachement |
|---|---|---|
| A — Map shell | ✅ Fait (PR en cours) | Socle existant |
| B — IA spots | Vague 2-3 | Enrichit les recommandations (AVANT) |
| C — Drag-drop activités | Vague 1 | Améliore la planification (AVANT) |
| D — Routing + optimisation | Vague 2 | Complète le mode convoi et les sessions (PENDANT) |
| E — Checklist IA | Vague 2 | Checklist collaborative enrichie par IA (AVANT) |
| F — Import tickets | Vague 5 | Enrichissement V2+ (AVANT) |

## Segments GPS (existant)

Phase 1 livrée. Les phases suivantes (anti-triche, offline, ghost run, éditeur carte) se fondent dans les vagues 2-3 selon priorité.

---

## Décisions de design clés

1. **Cercle fermé uniquement** — Pas de communauté publique tant que décision explicite du fondateur.
2. **MVP sans API bancaire** — Split dépenses par OCR/photo, pas Revolut/Powens.
3. **Spotify-first pour la musique** — API la plus mature. Deezer/Apple Music en V2.
4. **Montage IA = feature payante flagship** — Premier vrai vecteur de monétisation.
5. **Sessions rapides ≠ trips** — Les sessions sont légères (pas de planning, pas de jours). Un trip est structuré. Les deux coexistent.
6. **Chat intégré, pas une messagerie** — Le chat est dans le trip, pas un clone de WhatsApp. Il sert à coordonner et à alimenter l'album.
