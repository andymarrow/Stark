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

  const { data: p } = await supabase
    .from('projects')
    .select('title, thumbnail_url, likes_count, views, type')
    .eq('slug', slug)
    .single();

  if (!p) return new Response('Not Found', { status: 404 });

  return new ImageResponse(
    (
      <div style={{
        height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
        backgroundColor: '#09090b', color: 'white', padding: '50px',
        border: '1px solid #27272a', position: 'relative'
      }}>
        {/* 1. Industrial Grid Background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, #27272a 1px, transparent 1px)',
          backgroundSize: '30px 30px', opacity: 0.2
        }} />

        {/* 2. Top Bar: System ID */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', width: '100%', borderBottom: '1px solid #ff0000', paddingBottom: '15px' }}>
          <span style={{ fontSize: '20px', letterSpacing: '4px', color: '#ff0000', fontWeight: 'bold' }}>STARK_SYSTEM_INDEX //</span>
          <span style={{ fontSize: '20px', opacity: 0.5 }}>STATUS: ACTIVE</span>
        </div>

        <div style={{ display: 'flex', flex: 1, gap: '40px' }}>
          {/* 3. Left: The Visual Artifact */}
          <div style={{ display: 'flex', width: '60%', border: '1px solid #27272a', position: 'relative' }}>
            <img 
              src={p.thumbnail_url || 'https://stark-01.vercel.app/og-image.png'} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{ position: 'absolute', bottom: '15px', left: '15px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '5px 15px', fontSize: '14px', border: '1px solid #ff0000' }}>
              SCAN_REF: {p.type?.toUpperCase()}
            </div>
          </div>

          {/* 4. Right: Telemetry Data */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '40%', gap: '25px' }}>
            <h1 style={{ fontSize: '56px', margin: 0, fontWeight: '900', lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-2px' }}>
              {p.title}
            </h1>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '4px solid #ff0000', paddingLeft: '15px' }}>
                <span style={{ fontSize: '14px', color: '#71717a', letterSpacing: '2px' }}>METRIC_STARS</span>
                <span style={{ fontSize: '36px', fontWeight: 'bold' }}>{p.likes_count}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '4px solid #27272a', paddingLeft: '15px' }}>
                <span style={{ fontSize: '14px', color: '#71717a', letterSpacing: '2px' }}>METRIC_VIEWS</span>
                <span style={{ fontSize: '36px', fontWeight: 'bold' }}>{p.views}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Coordinate */}
        <div style={{ position: 'absolute', bottom: '30px', right: '50px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '1px', backgroundColor: '#ff0000' }} />
            <span style={{ fontSize: '12px', color: '#71717a' }}>NODE_ID: {slug}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}