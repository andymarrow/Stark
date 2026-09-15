-- Projects were locked to one "source" link whose meaning depended on the
-- project's type (code -> GitHub, design -> Figma, video -> YouTube), plus
-- one secondary demo_link. An owner couldn't add a GitHub repo to a design
-- project that already has a Figma link, etc. This column holds any number
-- of extra links independent of type: [{ type: 'github'|'figma'|'youtube'|
-- 'website'|'other', url, label? }, ...]. source_link/demo_link are
-- untouched — this is purely additive.
alter table public.projects
  add column if not exists additional_links jsonb not null default '[]'::jsonb;

comment on column public.projects.additional_links is
  'Extra project links beyond source_link/demo_link, independent of project type. Array of {type: github|figma|youtube|website|other, url, label?}.';
