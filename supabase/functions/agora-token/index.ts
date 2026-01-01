import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// FIX: Use 'npm:' to trigger Deno's full Node.js compatibility layer
import { RtcTokenBuilder, RtcRole } from 'npm:agora-access-token'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS Preflight Request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log("Received body:", body)

    const { channelName, uid, role } = body
    
    // 2. Check for missing ENV variables
    const APP_ID = Deno.env.get('AGORA_APP_ID')
    const APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE')

    if (!APP_ID || !APP_CERTIFICATE) {
      throw new Error("Server configuration error: Missing Agora Keys")
    }

    if (!channelName || !uid || !role) {
      throw new Error(`Missing parameters: channelName=${channelName}, uid=${uid}, role=${role}`)
    }

    // 3. Generate Token
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER
    const expirationTimeInSeconds = 3600 * 24
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    console.log("Generating token...")

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid, 
      rtcRole,
      privilegeExpiredTs
    )

    console.log("Token generated successfully")

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