-- Per-judge custom scoring rubrics.
-- Judges coming from different backgrounds (design, engineering, product...)
-- don't want to be forced into one shared metrics_config for the whole
-- contest. This lets a host give any individual judge their own weighted
-- rubric; a judge with no override just falls back to the contest's shared
-- contests.metrics_config, so nothing existing breaks.
alter table public.contest_judges
  add column if not exists metrics_config jsonb;

comment on column public.contest_judges.metrics_config is
  'Optional per-judge override of contests.metrics_config — same shape ([{name, type, weight}], type: manual|likes|views, weights summing to 100). Null = use the contest-wide rubric.';
