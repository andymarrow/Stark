import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// We use the Service Role Key to ensure the bot can always see the metadata
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) return new Response('Missing Slug', { status: 400 });

    // 1. Fetch Blog & Author Data
    const { data: b, error } = await supabase
      .from('blogs')
      .select('title, cover_image, likes_count, views, reading_time, author:profiles!author_id(username, avatar_url, full_name)')
      .eq('slug', slug)
      .single();

    if (error || !b) {
      console.error("Supabase Error:", error);
      return new Response('Intelligence Report Not Found', { status: 404 });
    }

    // 2. STARK_SAFE_FALLBACKS
    // Satori will crash if these URLs are null or undefined
    const imageSource = b.cover_image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200';
    const authorUsername = b.author?.username || 'STARK_OPERATOR';
    const authorDisplayName = b.author?.full_name || authorUsername;
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
          padding: '50px',
          position: 'relative',
          border: '12px solid #18181b', // Outer Industrial Frame
        }}>
          {/* 1. Tactical Grid Background Layer */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.4,
            display: 'flex'
          }} />

          {/* 2. TOP HEADER HUD */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            width: '100%', 
            marginBottom: '40px',
            zIndex: 10,
            borderBottom: '1px solid #27272a',
            paddingBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '14px', height: '14px', backgroundColor: '#ff0000', boxShadow: '0 0 10px #ff0000' }} />
                <span style={{ fontSize: '22px', letterSpacing: '6px', fontWeight: 'bold', color: '#ff0000', fontFamily: 'monospace' }}>
                    STARK_INTELLIGENCE_REPORT //
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '14px', color: '#52525b', letterSpacing: '2px', fontWeight: 'bold' }}>DECRYPTED_ACCESS: LEVEL_4</span>
                <span style={{ fontSize: '10px', color: '#3f3f46', marginTop: '4px' }}>REF_ID: {slug.substring(0, 16).toUpperCase()}</span>
            </div>
          </div>

          {/* 3. MAIN CONTENT MATRIX */}
          <div style={{ display: 'flex', flex: 1, gap: '50px', zIndex: 10 }}>
            
            {/* LEFT SIDE: INTEL DATA */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '60%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ 
                    fontSize: '80px', 
                    margin: 0, 
                    fontWeight: '900', 
                    lineHeight: 1, 
                    textTransform: 'uppercase', 
                    letterSpacing: '-4px',
                    color: 'white',
                    marginBottom: '30px'
                }}>
                    {b.title}
                </h1>
                
                {/* Author Card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                        display: 'flex', 
                        width: '60px', 
                        height: '60px', 
                        border: '2px solid #ff0000', 
                        overflow: 'hidden',
                        padding: '4px',
                        backgroundColor: '#000'
                    }}>
                        <img src={authorAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '28px', fontWeight: '900', color: 'white' }}>{authorDisplayName}</span>
                        <span style={{ fontSize: '18px', color: '#ef4444', fontWeight: 'bold', letterSpacing: '2px' }}>@{authorUsername.toUpperCase()}</span>
                    </div>
                </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div style={{ 
                display: 'flex', 
                gap: '40px', 
                borderTop: '1px solid #27272a', 
                paddingTop: '40px',
                paddingBottom: '20px'
              }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', color: '#71717a', letterSpacing: '3px', fontWeight: 'bold' }}>READ_TIME</span>
                      <span style={{ fontSize: '38px', fontWeight: '900', color: '#ff0000' }}>{b.reading_time || 5} MIN</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', color: '#71717a', letterSpacing: '3px', fontWeight: 'bold' }}>ENGAGEMENT</span>
                      <span style={{ fontSize: '38px', fontWeight: '900', color: 'white' }}>{b.likes_count || 0} STARS</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', color: '#71717a', letterSpacing: '3px', fontWeight: 'bold' }}>REACH</span>
                      <span style={{ fontSize: '38px', fontWeight: '900', color: 'white' }}>{b.views || 0} NODES</span>
                  </div>
              </div>
            </div>

            {/* RIGHT SIDE: CLIPPED COVER ASSET */}
            <div style={{ 
                display: 'flex', 
                width: '40%', 
                border: '1px solid #27272a', 
                position: 'relative', 
                overflow: 'hidden',
                backgroundColor: '#000',
                height: '100%'
            }}>
              <img 
                src={imageSource} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} 
              />
              
              {/* Tactical Overlay */}
              <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,0,0,0.03)'
              }}>
                  <div style={{ 
                      border: '2px solid #ff0000', 
                      padding: '15px 30px', 
                      transform: 'rotate(-20deg)',
                      fontSize: '14px',
                      color: '#ff0000',
                      fontWeight: '900',
                      letterSpacing: '8px',
                      backgroundColor: 'rgba(0,0,0,0.85)',
                      boxShadow: '0 0 20px rgba(255,0,0,0.2)'
                  }}>
                      SYSTEM_CLEARED
                  </div>
              </div>

              {/* Data Corner Decor */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', borderRight: '4px solid #ff0000', borderTop: '4px solid #ff0000' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40px', height: '40px', borderLeft: '4px solid #ff0000', borderBottom: '4px solid #ff0000' }} />
            </div>
          </div>

          {/* 4. FOOTER STATUS BAR */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '30px',
            borderTop: '1px solid #18181b',
            paddingTop: '20px',
            zIndex: 10
          }}>
              <span style={{ fontSize: '12px', color: '#3f3f46', letterSpacing: '5px', fontWeight: 'bold' }}>
                VERIFIED_STARK_TRANSMISSION_v2.4.0
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', opacity: 0.5 }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', opacity: 0.2 }} />
              </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e) {
    console.error("Blog OG Generation Error:", e.message);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}