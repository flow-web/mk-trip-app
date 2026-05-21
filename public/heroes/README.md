# Hero photos

Each trip_type expects 3 photos named `1.jpg`, `2.jpg`, `3.jpg` (~1600px wide, JPEG q80, < 250 KB each).

Suggested themes:

- `sport/` — skatepark, action, bowl
- `hike/` — crête montagne, sentier altitude, lac alpin
- `beach/` — vague, planche, plage longue
- `city_break/` — miradouro, tram, rue pavée
- `road_trip/` — route désertique, sunset highway, van profil
- `other/` — paysage neutre, route ouverte, ciel ouvert

The `defaultHeroFor(tripId, type)` helper (`lib/design/hero.ts`) picks one of the three per trip via a stable hash. A trip's `hero_image_url` column overrides the default when set.
