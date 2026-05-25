-- ─── Helper : calcul stats run depuis une trace + durée ───────────────────────
create or replace function public._compute_run_stats(
  p_trace       geometry,
  p_duration_ms integer
) returns table (
  distance_m     integer,
  speed_avg_kmh  numeric,
  speed_max_kmh  numeric
) language plpgsql
set search_path = public, extensions, pg_temp
as $$
declare
  v_dist_m float;
begin
  if p_duration_ms <= 0 then
    raise exception 'DURATION_ZERO';
  end if;
  v_dist_m := ST_Length(p_trace::geography);
  distance_m := round(v_dist_m)::integer;
  speed_avg_kmh := round(((v_dist_m / (p_duration_ms / 1000.0)) * 3.6)::numeric, 2);
  speed_max_kmh := round((speed_avg_kmh * 1.4)::numeric, 2);
  return next;
end;
$$;

-- ─── Helper : validate_run renvoie reason ou null si valide ───────────────────
create or replace function public._validate_run(
  p_segment_id  uuid,
  p_trace       geometry,
  p_duration_ms integer
) returns text language plpgsql
set search_path = public, extensions, pg_temp
as $$
declare
  v_seg              public.segments;
  v_rule             public.activity_rules;
  v_trace_len_m      float;
  v_speed_avg        numeric;
  v_dist_from_start  float;
  v_dist_from_end    float;
  v_hausdorff_m      float;
begin
  select * into v_seg from public.segments where id = p_segment_id;
  if v_seg.id is null then
    return 'SEGMENT_NOT_FOUND';
  end if;
  select * into v_rule from public.activity_rules where activity = v_seg.activity;

  if p_duration_ms < v_rule.min_duration_ms then
    return 'DURATION_TOO_SHORT';
  end if;

  v_trace_len_m := ST_Length(p_trace::geography);
  if v_trace_len_m < v_seg.distance_m * v_rule.distance_ratio_min then
    return 'TRACE_TOO_SHORT';
  end if;
  if v_trace_len_m > v_seg.distance_m * v_rule.distance_ratio_max then
    return 'TRACE_TOO_LONG';
  end if;

  v_speed_avg := (v_trace_len_m / (p_duration_ms / 1000.0)) * 3.6;
  if v_speed_avg > v_rule.max_speed_kmh then
    return 'SPEED_IMPOSSIBLE';
  end if;

  v_hausdorff_m := ST_HausdorffDistance(p_trace::geography, v_seg.geom::geography);
  if v_hausdorff_m > v_rule.hausdorff_tol_m then
    return 'OUT_OF_TRACK';
  end if;

  v_dist_from_start := ST_Distance(geography(ST_StartPoint(p_trace)), v_seg.start_point);
  v_dist_from_end   := ST_Distance(geography(ST_EndPoint(p_trace)),   v_seg.end_point);
  if v_dist_from_start > v_rule.hausdorff_tol_m * 2 then
    return 'START_TOO_FAR';
  end if;
  if v_dist_from_end > v_rule.hausdorff_tol_m * 2 then
    return 'END_TOO_FAR';
  end if;

  return null;
end;
$$;

-- ─── RPC : submit_run ─────────────────────────────────────────────────────────
create or replace function public.submit_run(
  p_segment_id  uuid,
  p_trace       geometry,
  p_duration_ms integer,
  p_started_at  timestamptz
) returns public.runs language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_reason text;
  v_stats record;
  v_run public.runs;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if ST_SRID(p_trace) <> 4326 then
    raise exception 'INVALID_SRID';
  end if;

  v_reason := public._validate_run(p_segment_id, p_trace, p_duration_ms);
  select * into v_stats from public._compute_run_stats(p_trace, p_duration_ms);

  insert into public.runs (
    segment_id, user_id, trace, duration_ms, distance_m,
    speed_avg_kmh, speed_max_kmh, started_at, is_valid, invalid_reason
  ) values (
    p_segment_id, auth.uid(), p_trace, p_duration_ms, v_stats.distance_m,
    v_stats.speed_avg_kmh, v_stats.speed_max_kmh, p_started_at,
    (v_reason is null), v_reason
  ) returning * into v_run;

  return v_run;
end;
$$;

-- ─── RPC : create_segment_from_run ────────────────────────────────────────────
create or replace function public.create_segment_from_run(
  p_name        text,
  p_description text,
  p_activity    activity_kind,
  p_trace       geometry,
  p_duration_ms integer,
  p_started_at  timestamptz,
  p_cover_color text default '#FF6B4A'
) returns public.segments language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_seg public.segments;
  v_dist int;
  v_stats record;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if ST_SRID(p_trace) <> 4326 then
    raise exception 'INVALID_SRID';
  end if;
  if ST_NumPoints(p_trace) < 2 then
    raise exception 'TRACE_TOO_FEW_POINTS';
  end if;

  v_dist := round(ST_Length(p_trace::geography))::integer;
  if v_dist < 50 then
    raise exception 'SEGMENT_TOO_SHORT';
  end if;

  insert into public.segments (creator_id, name, description, activity, geom, distance_m, cover_color)
    values (auth.uid(), p_name, p_description, p_activity, p_trace, v_dist, coalesce(p_cover_color, '#FF6B4A'))
    returning * into v_seg;

  select * into v_stats from public._compute_run_stats(p_trace, p_duration_ms);

  insert into public.runs (
    segment_id, user_id, trace, duration_ms, distance_m,
    speed_avg_kmh, speed_max_kmh, started_at, is_valid
  ) values (
    v_seg.id, auth.uid(), p_trace, p_duration_ms, v_stats.distance_m,
    v_stats.speed_avg_kmh, v_stats.speed_max_kmh, p_started_at, true
  );

  return v_seg;
end;
$$;

grant execute on function public.submit_run to authenticated;
grant execute on function public.create_segment_from_run to authenticated;
