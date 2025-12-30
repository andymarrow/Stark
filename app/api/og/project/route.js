import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  // 1. Fetch Fresh Stats
  const { data: p } = await supabase
    .from('projects')
    .select('title, thumbnail_url, likes_count, views')
    .eq('slug', slug)
    .single();

  if (!p) return new Response('Not Found', { status: 404 });

  return new ImageResponse(
    (
      <div style={{
        height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b',
        border: '20px solid #18181b', padding: '40px', fontFamily: 'monospace'
      }}>
        {/* Project Thumbnail */}
        <img 
          src={p.thumbnail_url || 'https://stark-01.vercel.app/og-image.png'} 
          style={{ width: '800px', height: '400px', objectFit: 'cover', border: '2px solid #333' }} 
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '30px', width: '800px' }}>
          <h1 style={{ fontSize: '60px', color: 'white', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>
            {p.title}
          </h1>
          
          <div style={{ display: 'flex', marginTop: '20px', gap: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#ff0000', fontSize: '30px' }}>★</span>
              <span style={{ color: 'white', fontSize: '30px' }}>{p.likes_count} STARS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#555', fontSize: '30px' }}>👁</span>
              <span style={{ color: 'white', fontSize: '30px' }}>{p.views} VIEWS</span>
            </div>
          </div>
        </div>
        
        <div style={{ position: 'absolute', bottom: '40px', right: '60px', color: '#ff0000', fontSize: '24px', fontWeight: 'bold' }}>
          STARK_NETWORK //
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}