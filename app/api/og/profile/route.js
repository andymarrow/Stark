import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // 1. Fetch Stats
    const { data: user, error } = await supabase.from('profiles').select('*').eq('username', username).single();
    if (error || !user) return new Response('Not Found', { status: 404 });

    const [projCount, followerCount] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id)
    ]);

    return new ImageResponse(
      (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#09090b',
          padding: '80px',
          position: 'relative',
          border: '12px solid #18181b'
        }}>
          {/* Subtle Blueprint Lines */}
          <div style={{ display: 'flex', position: 'absolute', top: '15%', left: 0, width: '100%', height: '1px', backgroundColor: '#27272a' }} />
          <div style={{ display: 'flex', position: 'absolute', top: '85%', left: 0, width: '100%', height: '1px', backgroundColor: '#27272a' }} />

          <div style={{ display: 'flex', alignItems: 'center', flex: 1, zIndex: 10 }}>
            {/* Identity Photo (Passport Style) */}
            <div style={{ display: 'flex', padding: '12px', border: '2px solid #ff0000', backgroundColor: '#000', boxShadow: '0 0 30px rgba(255,0,0,0.1)' }}>
              <img 
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${username}&background=09090b&color=fff&size=512`} 
                style={{ width: '300px', height: '300px', objectFit: 'cover' }} 
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '60px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ color: '#ff0000', fontSize: '20px', fontWeight: 'bold', letterSpacing: '4px', display: 'flex' }}>CREATOR_DOSSIER //</span>
                  <div style={{ display: 'flex', height: '2px', flex: 1, backgroundColor: '#27272a' }} />
                  <span style={{ color: '#22c55e', fontSize: '14px', border: '1px solid #22c55e', padding: '4px 12px', letterSpacing: '2px', display: 'flex' }}>VERIFIED_NODE</span>
              </div>

              <div style={{ display: 'flex' }}>
                <h1 style={{ fontSize: '84px', color: 'white', margin: '15px 0', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '-4px', lineHeight: 1 }}>
                  {user?.full_name || username}
                </h1>
              </div>

              <div style={{ display: 'flex' }}>
                <p style={{ color: '#ff0000', fontSize: '32px', margin: 0, letterSpacing: '6px', fontWeight: 'bold' }}>@{username.toUpperCase()}</p>
              </div>
              
              {/* Stats Modules (Text now centered) */}
              <div style={{ display: 'flex', marginTop: '60px', gap: '25px' }}>
                
                {/* Projects Box */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  width: '180px', 
                  backgroundColor: '#000', 
                  padding: '20px', 
                  border: '1px solid #27272a',
                  alignItems: 'center', // Horizontal Center
                  justifyContent: 'center' // Vertical Center
                }}>
                  <span style={{ color: 'white', fontSize: '48px', fontWeight: 'bold', lineHeight: 1 }}>{projCount.count || 0}</span>
                  <span style={{ color: '#71717a', fontSize: '12px', letterSpacing: '2px', marginTop: '10px' }}>PROJECTS</span>
                </div>

                {/* Followers Box */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  width: '180px', 
                  backgroundColor: '#000', 
                  padding: '20px', 
                  border: '1px solid #27272a',
                  alignItems: 'center', // Horizontal Center
                  justifyContent: 'center' // Vertical Center
                }}>
                  <span style={{ color: 'white', fontSize: '48px', fontWeight: 'bold', lineHeight: 1 }}>{followerCount.count || 0}</span>
                  <span style={{ color: '#71717a', fontSize: '12px', letterSpacing: '2px', marginTop: '10px' }}>FOLLOWERS</span>
                </div>

                {/* Node Reach Box */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  width: '180px', 
                  backgroundColor: '#18181b', 
                  padding: '20px', 
                  border: '1px solid #ff0000',
                  alignItems: 'center', // Horizontal Center
                  justifyContent: 'center' // Vertical Center
                }}>
                  <span style={{ color: '#ff0000', fontSize: '48px', fontWeight: 'bold', lineHeight: 1 }}>{user?.views || 0}</span>
                  <span style={{ color: 'white', fontSize: '12px', letterSpacing: '2px', marginTop: '10px', opacity: 0.6 }}>NODE_REACH</span>
                </div>

              </div>
            </div>
          </div>

          <div style={{ display: 'flex', position: 'absolute', bottom: '40px', right: '80px', fontSize: '12px', color: '#3f3f46', letterSpacing: '8px' }}>
            SECURED_BY_STARK_CORE_v1
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}