import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) return new Response('Missing Slug', { status: 400 });

    // 1. Fetch Project Data
    const { data: p, error } = await supabase
      .from('projects')
      .select('title, thumbnail_url, likes_count, views, type')
      .eq('slug', slug)
      .single();

    if (error || !p) {
      return new Response('Project Not Found', { status: 404 });
    }

    // Image Validation
    let imageSource = p.thumbnail_url;
    if (!imageSource || !imageSource.startsWith('http')) {
        imageSource = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200';
    }

    return new ImageResponse(
      (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex', // EXPLICIT
          flexDirection: 'column',
          backgroundColor: '#09090b',
          color: 'white',
          padding: '50px',
          border: '1px solid #27272a',
          position: 'relative'
        }}>
          {/* 1. Industrial Grid Background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, #27272a 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.2,
            display: 'flex' // EXPLICIT (Fixes background crash)
          }} />

          {/* 2. Top Bar */}
          <div style={{ 
            display: 'flex', // EXPLICIT
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '40px', 
            width: '100%', 
            borderBottom: '2px solid #ff0000', 
            paddingBottom: '20px' 
          }}>
            <div style={{ display: 'flex' }}>
                <span style={{ fontSize: '24px', letterSpacing: '6px', color: '#ff0000', fontWeight: 'bold' }}>STARK_SYSTEM_INDEX //</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff0000', marginRight: '10px' }} />
                <span style={{ fontSize: '20px', opacity: 0.8, letterSpacing: '2px' }}>LIVE_NODE_SYNC</span>
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1, gap: '50px' }}>
            {/* 3. Left Side */}
            <div style={{ 
                display: 'flex', // EXPLICIT
                width: '65%', 
                border: '1px solid #27272a', 
                position: 'relative', 
                overflow: 'hidden',
                backgroundColor: '#000' 
            }}>
              <img 
                src={imageSource} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ 
                display: 'flex', // EXPLICIT
                position: 'absolute', 
                bottom: '20px', 
                left: '20px', 
                backgroundColor: '#ff0000', 
                color: 'white', 
                padding: '5px 20px', 
                fontSize: '16px', 
                fontWeight: 'bold' 
              }}>
                <span style={{ display: 'flex' }}>DATA_TYPE: {p.type?.toUpperCase()}</span>
              </div>
            </div>

            {/* 4. Right Side */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '35%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex' }}>
                <h1 style={{ 
                    fontSize: '64px', 
                    margin: 0, 
                    fontWeight: '900', 
                    lineHeight: 0.9, 
                    textTransform: 'uppercase', 
                    letterSpacing: '-3px' 
                }}>
                    {p.title}
                </h1>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    borderLeft: '5px solid #ff0000', 
                    paddingLeft: '20px', 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    padding: '15px' 
                }}>
                  <span style={{ fontSize: '14px', color: '#71717a', letterSpacing: '3px', display: 'flex' }}>STARK_STARS</span>
                  <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#ff0000', display: 'flex' }}>{p.likes_count || 0}</span>
                </div>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    borderLeft: '5px solid #27272a', 
                    paddingLeft: '20px', 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    padding: '15px' 
                }}>
                  <span style={{ fontSize: '14px', color: '#71717a', letterSpacing: '3px', display: 'flex' }}>STARK_VIEWS</span>
                  <span style={{ fontSize: '48px', fontWeight: 'bold', display: 'flex' }}>{p.views || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            position: 'absolute', 
            bottom: '30px', 
            left: '50px', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
              <span style={{ fontSize: '12px', color: '#52525b', letterSpacing: '2px', display: 'flex' }}>STARK_PROTOCOL_V1.0.4</span>
              <div style={{ display: 'flex', width: '100px', height: '1px', backgroundColor: '#27272a', marginLeft: '15px', marginRight: '15px' }} />
              <span style={{ fontSize: '12px', color: '#52525b', display: 'flex' }}>NODE: {slug}</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e) {
    console.error("OG Generation Error:", e.message);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}