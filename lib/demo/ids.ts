// lib/demo/ids.ts — IDs des profils démo extraits dans un module dédié
// pour éviter la référence circulaire entre fixtures.ts et fixtures-*.ts
// (Turbopack levait "Cannot access X before initialization" au build prerender).

export const DEMO_USER_ID = 'demo-user-lina'
export const DEMO_PARTNER_ID = 'demo-user-tom'
export const DEMO_CAMILLE_ID = 'demo-user-camille'
export const DEMO_YANIS_ID = 'demo-user-yanis'
export const DEMO_SAM_ID = 'demo-user-sam'
export const DEMO_INES_ID = 'demo-user-ines'
