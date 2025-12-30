import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  const { data: user } = await supabase.from('profiles').select('*').eq('username', username).single();
  const { count: projCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', user?.id);
  const { count: followerCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user?.id);

  return new ImageResponse(
    (
      <div style={{
        height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
        backgroundColor: '#09090b', padding: '60px', position: 'relative', border: '10px solid #18181b'
      }}>
        {/* Subtle Engineering Lines */}
        <div style={{ position: 'absolute', top: '10%', left: 0, width: '100%', height: '1px', backgroundColor: '#27272a' }} />
        <div style={{ position: 'absolute', top: '90%', left: 0, width: '100%', height: '1px', backgroundColor: '#27272a' }} />

        <div style={{ display: 'flex', alignItems: 'center', flex: 1, zIndex: 10 }}>
          {/* Identity Photo (Passport Style) */}
          <div style={{ display: 'flex', padding: '10px', border: '1px solid #ff0000', backgroundColor: '#000' }}>
            <img 
              src={user?.avatar_url || 'https://ui-avatars.com/api/?name=' + username} 
              style={{ width: '320px', height: '320px', objectFit: 'cover' }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '60px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ color: '#ff0000', fontSize: '24px', fontWeight: 'bold' }}>IDENTITY_FILE //</span>
                <span style={{ color: '#22c55e', fontSize: '14px', border: '1px solid #22c55e', padding: '2px 10px' }}>VERIFIED</span>
            </div>

            <h1 style={{ fontSize: '72px', color: 'white', margin: '10px 0', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '-3px' }}>
              {user?.full_name || username}
            </h1>
            <p style={{ color: '#ff0000', fontSize: '32px', margin: 0, letterSpacing: '4px' }}>@{username.toUpperCase()}</p>
            
            {/* Stats Modules */}
            <div style={{ display: 'flex', marginTop: '50px', gap: '30px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: '160px', backgroundColor: '#18181b', padding: '15px', border: '1px solid #27272a' }}>
                <span style={{ color: 'white', fontSize: '40px', fontWeight: 'bold' }}>{projCount}</span>
                <span style={{ color: '#71717a', fontSize: '12px', letterSpacing: '2px' }}>PROJECTS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', width: '160px', backgroundColor: '#18181b', padding: '15px', border: '1px solid #27272a' }}>
                <span style={{ color: 'white', fontSize: '40px', fontWeight: 'bold' }}>{followerStats?.followers || 0}</span>
                <span style={{ color: '#71717a', fontSize: '12px', letterSpacing: '2px' }}>NETWORK</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', width: '160px', backgroundColor: '#18181b', padding: '15px', border: '1px solid #27272a' }}>
                <span style={{ color: '#ff0000', fontSize: '40px', fontWeight: 'bold' }}>{user?.views || 0}</span>
                <span style={{ color: '#71717a', fontSize: '12px', letterSpacing: '2px' }}>REACH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Branding Watermark */}
        <div style={{ position: 'absolute', bottom: '40px', left: '60px', fontSize: '14px', color: '#71717a', letterSpacing: '10px' }}>
          STARK_PROTOCOL_V1.0.4
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}