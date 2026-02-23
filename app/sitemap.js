import { createClient } from '@supabase/supabase-js';

/** Cookie-less Supabase client for sitemap (runs at build time, no request/cookies). */
function getSitemapSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(url, key);
}

const CHUNK_SIZE = 2000;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stark.et';

function url(path) {
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Static routes included in the sitemap. */
const STATIC_ROUTES = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/explore', changeFrequency: 'daily', priority: 0.9 },
  { path: '/contests', changeFrequency: 'daily', priority: 0.9 },
  { path: '/trending', changeFrequency: 'daily', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/legal/guidelines', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/legal/terms', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/legal/privacy', changeFrequency: 'yearly', priority: 0.4 },
];

function staticEntries() {
  const now = new Date();
  return STATIC_ROUTES.map(({ path: p, changeFrequency, priority }) => ({
    url: url(p),
    lastModified: now,
    changeFrequency,
    priority,
  }));
}

/**
 * Fetch counts for projects and profiles to build paginated sitemap ids.
 * Uses small queries to avoid timeouts; actual data is fetched per segment.
 */
export async function generateSitemaps() {
  const supabase = getSitemapSupabase();

  const [
    { count: projectCount },
    { count: profileCount },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('slug', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('is_contest_entry', false),
    supabase
      .from('profiles')
      .select('username', { count: 'exact', head: true }),
  ]);

  const nProjectChunks = Math.ceil(Math.max(0, projectCount || 0) / CHUNK_SIZE);
  const nProfileChunks = Math.ceil(Math.max(0, profileCount || 0) / CHUNK_SIZE);

  const ids = [{ id: 'static' }];
  for (let i = 0; i < nProjectChunks; i++) ids.push({ id: `projects-${i}` });
  for (let i = 0; i < nProfileChunks; i++) ids.push({ id: `profiles-${i}` });
  ids.push({ id: 'contests' });

  return ids;
}

export default async function sitemap(props) {
  const id = typeof props?.id === 'object' && props.id && 'then' in props.id
    ? await props.id
    : props?.id;

  if (id === 'static') {
    return staticEntries();
  }

  const supabase = getSitemapSupabase();
  const now = new Date();

  if (id === 'contests') {
    const { data: contests } = await supabase
      .from('contests')
      .select('slug, updated_at, created_at')
      .neq('status', 'draft');
    return (contests || []).map((c) => ({
      url: url(`/contests/${c.slug}`),
      lastModified: (c.updated_at || c.created_at) ? new Date(c.updated_at || c.created_at) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  }

  if (typeof id === 'string' && id.startsWith('projects-')) {
    const page = parseInt(id.replace('projects-', ''), 10);
    if (Number.isNaN(page) || page < 0) return staticEntries();
    const from = page * CHUNK_SIZE;
    const to = from + CHUNK_SIZE - 1;
    const { data: projects } = await supabase
      .from('projects')
      .select('slug, updated_at, created_at')
      .eq('status', 'published')
      .eq('is_contest_entry', false)
      .order('created_at', { ascending: false })
      .range(from, to);
    return (projects || []).map((p) => ({
      url: url(`/project/${p.slug}`),
      lastModified: (p.updated_at || p.created_at) ? new Date(p.updated_at || p.created_at) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  }

  if (typeof id === 'string' && id.startsWith('profiles-')) {
    const page = parseInt(id.replace('profiles-', ''), 10);
    if (Number.isNaN(page) || page < 0) return [];
    const from = page * CHUNK_SIZE;
    const to = from + CHUNK_SIZE - 1;
    const { data: profiles } = await supabase
      .from('profiles')
      .select('username, updated_at, created_at')
      .order('created_at', { ascending: false })
      .range(from, to);
    return (profiles || []).map((u) => ({
      url: url(`/profile/${u.username}`),
      lastModified: (u.updated_at || u.created_at) ? new Date(u.updated_at || u.created_at) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  }

  return staticEntries();
}
