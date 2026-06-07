import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role credentials');
  return createClient(url, key);
}

function generateSlug(text) {
  return text.toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');
}

function calculateReadingTime(text) {
  if (!text) return 1;
  const plain = text.replace(/[#*_[\]()>`!]/g, '');
  const words = plain.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 238));
}

export async function POST(request) {
  // --- AUTH ---
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.BLOG_PUBLISH_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    author_username,
    title,
    content,
    excerpt = '',
    cover_image = '',
    tags = [],
    status = 'published',
  } = body;

  if (!author_username || !title || !content) {
    return NextResponse.json(
      { error: 'author_username, title, and content are required' },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // --- LOOK UP AUTHOR ---
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', author_username)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: `Author "${author_username}" not found` }, { status: 404 });
  }

  // --- SLUG (unique) ---
  const baseSlug = generateSlug(title);
  const { count } = await supabase
    .from('blogs')
    .select('id', { count: 'exact', head: true })
    .ilike('slug', `${baseSlug}%`);
  const finalSlug = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;

  // --- INSERT BLOG ---
  const now = new Date().toISOString();
  const blogPayload = {
    author_id: profile.id,
    title,
    excerpt: excerpt.substring(0, 160),
    content,
    cover_image,
    tags: tags.slice(0, 5).map(t => t.toUpperCase().replace(/[^A-Z0-9_]/g, '_')),
    slug: finalSlug,
    reading_time: calculateReadingTime(content),
    status,
    updated_at: now,
    ...(status === 'published' && { published_at: now }),
  };

  const { data: blog, error: blogErr } = await supabase
    .from('blogs')
    .insert(blogPayload)
    .select('id')
    .single();

  if (blogErr) {
    return NextResponse.json({ error: blogErr.message }, { status: 500 });
  }

  // --- INSERT FIRST VERSION ---
  await supabase.from('blog_versions').insert({
    blog_id: blog.id,
    version_number: 1,
    content_markdown: content,
    content_json: {},
  });

  return NextResponse.json({
    success: true,
    blog_id: blog.id,
    slug: finalSlug,
    url: `/${profile.username}/blog/${finalSlug}`,
  });
}
