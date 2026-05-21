# PWA icons

3 PNG attendus :

- `192.png` — 192×192, fond paper `#F2EDE3`, logo MK en charbon
- `512.png` — 512×512, idem
- `512-maskable.png` — 512×512, padding 12 % safe-zone (logo dans cercle utile)

Outils suggérés :
- `npx pwa-asset-generator <source.svg> public/icons --background "#F2EDE3" --opaque false`
- Figma : export à 192 / 512 / 512 maskable
- Manuel via Photoshop / Sketch

Une fois en place, vérifier dans devtools Application → Manifest que les 3 icônes chargent.
