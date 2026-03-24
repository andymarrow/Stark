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

    // 1. Fetch Blog & Author Data (Using Service Role, so it bypasses RLS)
    const { data: b, error } = await supabase
      .from('blogs')
      .select('title, cover_image, likes_count, views, reading_time, author:profiles!author_id(username, avatar_url, full_name)')
      .eq('slug', slug)
      .single();

    if (error || !b) return new Response('Intelligence Report Not Found', { status: 404 });

    // 2. ULTRA-SAFE FALLBACKS (Prevents Satori Crashes)
    const imageSource = b.cover_image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200';
    const authorUsername = b.author?.username || 'UNKNOWN_NODE';
    const authorAvatar = b.author?.avatar_url || `https://ui-avatars.com/api/?name=${authorUsername}&background=09090b&color=ef4444`;

    return new ImageResponse(
      (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#050505',
          color: 'white',
          padding: '40px',
          position: 'relative',
          border: '10px solid #18181b',
        }}>
          {/* 1. Tactical Grid Background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.3,
            display: 'flex'
          }} />

          {/* 2. Top Header HUD */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            width: '100%', 
            marginBottom: '30px',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444' }} />
                <span style={{ fontSize: '20px', letterSpacing: '4px', fontWeight: 'bold', color: '#ef4444' }}>STARK_INTELLIGENCE_REPORT //</span>
            </div>
            <span style={{ fontSize: '16px', color: '#52525b', letterSpacing: '2px' }}>DECRYPTED_ACCESS: LEVEL_4</span>
          </div>

          <div style={{ display: 'flex', flex: 1, gap: '40px', zIndex: 10 }}>
            {/* 3. Left Side: Content & Meta */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '60%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ 
                    fontSize: '72px', 
                    margin: 0, 
                    fontWeight: '900', 
                    lineHeight: 1, 
                    textTransform: 'uppercase', 
                    letterSpacing: '-3px',
                    color: 'white'
                }}>
                    {b.title}
                </h1>
                
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '30px', gap: '15px' }}>
                    <div style={{ display: 'flex', width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ef4444' }}>
                        <img src={authorAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#a1a1aa' }}>@{authorUsername.toUpperCase()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '30px', borderTop: '1px solid #27272a', paddingTop: '30px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', color: '#71717a', letterSpacing: '2px' }}>READ_TIME</span>
                      <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{b.reading_time || 5} MIN</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', color: '#71717a', letterSpacing: '2px' }}>ENGAGEMENT</span>
                      <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{b.likes_count || 0} STARS</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', color: '#71717a', letterSpacing: '2px' }}>REACH</span>
                      <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{b.views || 0} NODES</span>
                  </div>
              </div>
            </div>

            {/* 4. Right Side: Clipped Asset Cover */}
            <div style={{ 
                display: 'flex', 
                width: '40%', 
                border: '1px solid #27272a', 
                position: 'relative', 
                overflow: 'hidden',
                backgroundColor: '#000' 
            }}>
              <img 
                src={imageSource} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} 
              />
              <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,0,0,0.05)'
              }}>
                  <div style={{ 
                      border: '1px solid #ff0000', 
                      padding: '10px 20px', 
                      transform: 'rotate(-15deg)',
                      fontSize: '12px',
                      color: '#ff0000',
                      fontWeight: 'bold',
                      letterSpacing: '5px',
                      backgroundColor: 'rgba(0,0,0,0.8)'
                  }}>
                      SYSTEM_CLEARED
                  </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div style={{ 
            position: 'absolute', 
            bottom: '30px', 
            left: '40px', 
            right: '40px',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #18181b',
            paddingTop: '15px'
          }}>
              <span style={{ fontSize: '12px', color: '#3f3f46', letterSpacing: '4px' }}>VERIFIED_STARK_TRANSMISSION_v2.4.0</span>
              <span style={{ fontSize: '12px', color: '#3f3f46' }}>HASH_ID: {slug.substring(0, 12)}</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e) {
    console.error("Blog OG Error:", e.message);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}