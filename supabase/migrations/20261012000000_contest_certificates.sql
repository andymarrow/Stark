-- Participation certificates for a contest.
--
-- An admin uploads one certificate design per contest (PDF, or an SVG the
-- admin page flattens to a one-page PDF before upload), marks where the
-- name goes, and — once the contest has ended — emails every participant
-- their own copy with their name filled in.
--
-- "Participant" means a person on a submitted entry: the project owner, or
-- a collaborator who ACCEPTED the invite. Pending invites don't get one.
--
-- Both tables are service-role only (no policies): every read and write
-- goes through app/actions/certificateActions.js, which checks the caller
-- is a platform admin first.

-- The design itself. Private bucket — templates are only ever read
-- server-side to render a certificate, never linked publicly.
insert into storage.buckets (id, name, public)
values ('certificate-templates', 'certificate-templates', false)
on conflict (id) do nothing;

create table if not exists public.contest_certificates (
  contest_id uuid primary key references public.contests(id) on delete cascade,
  -- Object path inside the certificate-templates bucket. Always a PDF.
  template_path text not null,
  -- What the admin originally uploaded, for display only.
  source_type text not null check (source_type in ('pdf', 'svg')),
  source_filename text,
  -- Page size in PDF points, read from the template on save.
  page_width real not null,
  page_height real not null,
  -- Where the name is drawn, in PDF points from the page's TOP-left:
  -- { x, y (baseline), fontSize, color: "#rrggbb", align: left|center|right, maxWidth }
  name_layout jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- One row per person per contest, created the first time the admin edits
-- that person's printed name or a certificate is sent to them. Doubles as
-- the send ledger, so a bulk send can be stopped and resumed without
-- emailing anyone twice.
create table if not exists public.contest_certificate_deliveries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- Admin-corrected name to print instead of the profile's full_name
  -- (emoji handles, nicknames, scripts the certificate font can't draw).
  name_override text,
  status text check (status in ('sent', 'failed')),
  email text,
  printed_name text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contest_id, user_id)
);

create index if not exists contest_certificate_deliveries_contest_id_idx
  on public.contest_certificate_deliveries(contest_id);

alter table public.contest_certificates enable row level security;
alter table public.contest_certificate_deliveries enable row level security;
