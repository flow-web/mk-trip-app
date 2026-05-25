create or replace view public.segments_public as
  select
    s.id,
    s.creator_id,
    s.name,
    s.description,
    s.activity,
    s.distance_m,
    s.cover_color,
    s.created_at,
    ST_X(ST_StartPoint(s.geom))::float as start_lng,
    ST_Y(ST_StartPoint(s.geom))::float as start_lat,
    ST_X(ST_EndPoint(s.geom))::float   as end_lng,
    ST_Y(ST_EndPoint(s.geom))::float   as end_lat,
    ST_AsGeoJSON(s.geom)::json         as geom_geojson
  from public.segments s;

grant select on public.segments_public to anon, authenticated;
