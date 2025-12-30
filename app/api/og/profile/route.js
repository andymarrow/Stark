import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  // Fetch Profile + Project Count + Follower Count
  const { data: user } = await supabase.from('profiles').select('*').eq('username', username).single();
  const { count: projCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', user?.id);
  const { count: followerCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user?.id);

  return new ImageResponse(
    (
      <div style={{
        height: '100%', width: '100%', display: 'flex', alignItems: 'center', 
        backgroundColor: '#09090b', padding: '80px', fontFamily: 'monospace'
      }}>
        <img 
          src={user?.avatar_url || 'https://ui-avatars.com/api/?name=' + username} 
          style={{ width: '300px', height: '300px', border: '5px solid #ff0000' }} 
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '60px' }}>
          <span style={{ color: '#ff0000', fontSize: '24px', marginBottom: '10px' }}>CREATOR_DOSSIER</span>
          <h1 style={{ fontSize: '80px', color: 'white', margin: 0, textTransform: 'uppercase' }}>
            {user?.full_name || username}
          </h1>
          <p style={{ color: '#71717a', fontSize: '30px' }}>@{username}</p>
          
          <div style={{ display: 'flex', marginTop: '40px', gap: '50px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'white', fontSize: '40px', fontWeight: 'bold' }}>{projCount}</span>
              <span style={{ color: '#555', fontSize: '18px' }}>PROJECTS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'white', fontSize: '40px', fontWeight: 'bold' }}>{followerCount}</span>
              <span style={{ color: '#555', fontSize: '18px' }}>FOLLOWERS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'white', fontSize: '40px', fontWeight: 'bold' }}>{user?.views}</span>
              <span style={{ color: '#555', fontSize: '18px' }}>REACH</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}