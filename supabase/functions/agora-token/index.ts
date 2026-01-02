import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { RtcTokenBuilder, RtcRole } from 'npm:agora-access-token'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { channelName, uid, role } = await req.json()
    
    // IMPORTANT: Ensure UID is an integer (0 is valid for auto-assign, but we are passing a specific one)
    const uidInt = parseInt(uid);

    const APP_ID = Deno.env.get('AGORA_APP_ID')
    const APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE')

    if (!APP_ID || !APP_CERTIFICATE) {
      throw new Error("Server configuration error: Missing Agora Keys")
    }

    // Role: 1 = Publisher (Host), 2 = Subscriber (Audience)
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER
    
    // Token validity time
    const expirationTimeInSeconds = 3600
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    console.log(`Generating token for Channel: ${channelName}, UID: ${uidInt}, Role: ${rtcRole}`)

    // CRITICAL FIX: Ensure we use the correct builder method for numeric UIDs
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uidInt, 
      rtcRole,
      privilegeExpiredTs
    )

    return new Response(
      JSON.stringify({ token }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Error generating token:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})