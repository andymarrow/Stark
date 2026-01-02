import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Stark-Bot/1.0' } // Behave like a bot
    });
    
    const html = await response.text();

    // Simple Regex Parsers for OG Tags (No heavy npm dependencies needed)
    const getMetaTag = (name) => {
      const match = html.match(
        new RegExp(`<meta property="og:${name}" content="([^"]*)"`, 'i')
      ) || html.match(
        new RegExp(`<meta name="${name}" content="([^"]*)"`, 'i')
      );
      return match ? match[1] : null;
    };

    const getTitle = () => {
      const ogTitle = getMetaTag('title');
      if (ogTitle) return ogTitle;
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      return titleMatch ? titleMatch[1] : null;
    };

    const data = {
      title: getTitle(),
      description: getMetaTag('description'),
      image: getMetaTag('image'),
      url: targetUrl,
      siteName: getMetaTag('site_name') || new URL(targetUrl).hostname
    };

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}