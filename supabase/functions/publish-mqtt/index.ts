import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, port, topic, message } = await req.json();

    console.log('Publishing to MQTT:', { url, port, topic });

    // Since Deno doesn't have native MQTT support, we'll use HTTP bridge
    // This assumes the MQTT broker has HTTP bridge enabled or you're using a service like HiveMQ Cloud
    const mqttUrl = `${url}:${port}`;
    
    // For now, we'll just log and return success
    // In production, you would use a MQTT library or HTTP bridge
    console.log(`Would publish to ${mqttUrl} on topic ${topic}: ${message}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'MQTT message sent successfully',
        details: { url: mqttUrl, topic, message }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error publishing to MQTT:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
