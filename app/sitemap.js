import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stark.et';

function getSitemapSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function makeEntry(path, changeFrequency, priority, lastModified) {
  return {
    url: `${BASE_URL}${path}`,
    lastModified: lastModified || new Date(),
    changeFrequency,
    priority,
  };
}

const STATIC_ROUTES = [
  { path: '/',                    changeFrequency: 'daily',   priority: 1   },
  { path: '/explore',             changeFrequency: 'daily',   priority: 0.9 },
  { path: '/trending',            changeFrequency: 'daily',   priority: 0.9 },
  { path: '/contests',            changeFrequency: 'daily',   priority: 0.9 },
  { path: '/blog',                changeFrequency: 'daily',   priority: 0.8 },
  { path: '/about',               changeFrequency: 'monthly', priority: 0.6 },
  { path: '/legal/guidelines',    changeFrequency: 'yearly',  priority: 0.4 },
  { path: '/legal/terms',         changeFrequency: 'yearly',  priority: 0.4 },
  { path: '/legal/privacy',       changeFrequency: 'yearly',  priority: 0.4 },
];

export default async function sitemap() {
  const entries = STATIC_ROUTES.map(({ path, changeFrequency, priority }) =>
    makeEntry(path, changeFrequency, priority)
  );

  const supabase = getSitemapSupabase();
  if (!supabase) return entries;

  try {
    const [profilesRes, projectsRes, blogsRes, contestsRes, eventsRes] = await Promise.allSettled([
      supabase
        .from('profiles')
        .select('username, updated_at, created_at')
        .order('created_at', { ascending: false })
        .limit(5000),
      supabase
        .from('projects')
        .select('slug, updated_at, created_at')
        .eq('status', 'published')
        .eq('is_contest_entry', false)
        .order('created_at', { ascending: false })
        .limit(5000),
      supabase
        .from('blogs')
        .select('slug, published_at, updated_at, author:profiles!author_id(username)')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(2000),
      supabase
        .from('contests')
        .select('slug, updated_at, created_at')
        .neq('status', 'draft')
        .limit(1000),
      supabase
        .from('events')
        .select('id, updated_at, created_at')
        .eq('is_public', true)
        .limit(1000),
    ]);

    if (profilesRes.status === 'fulfilled') {
      for (const u of profilesRes.value.data || []) {
        entries.push(makeEntry(
          `/profile/${u.username}`,
          'weekly',
          0.9,
          u.updated_at || u.created_at,
        ));
      }
    }

    if (projectsRes.status === 'fulfilled') {
      for (const p of projectsRes.value.data || []) {
        entries.push(makeEntry(
          `/project/${p.slug}`,
          'weekly',
          0.8,
          p.updated_at || p.created_at,
        ));
      }
    }

    if (blogsRes.status === 'fulfilled') {
      for (const b of blogsRes.value.data || []) {
        if (!b.author?.username) continue;
        entries.push(makeEntry(
          `/${b.author.username}/blog/${b.slug}`,
          'monthly',
          0.7,
          b.updated_at || b.published_at,
        ));
      }
    }

    if (contestsRes.status === 'fulfilled') {
      for (const c of contestsRes.value.data || []) {
        entries.push(makeEntry(
          `/contests/${c.slug}`,
          'weekly',
          0.8,
          c.updated_at || c.created_at,
        ));
      }
    }

    if (eventsRes.status === 'fulfilled') {
      for (const e of eventsRes.value.data || []) {
        entries.push(makeEntry(
          `/events/${e.id}`,
          'weekly',
          0.6,
          e.updated_at || e.created_at,
        ));
      }
    }
  } catch (err) {
    console.error('[sitemap] DB fetch failed, returning static entries only:', err);
  }

  return entries;
}
