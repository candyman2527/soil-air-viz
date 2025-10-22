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

    console.log('Publishing to MQTT:', { url, port, topic, message });

    // Try to connect via WebSocket (MQTT over WebSocket)
    // Most MQTT brokers support WebSocket on port 9001 or 8083
    const wsPort = port === 1883 ? 9001 : port;
    const wsUrl = `ws://${url}:${wsPort}`;
    
    try {
      // Try WebSocket connection first
      const socket = new WebSocket(wsUrl);
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.close();
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        socket.onopen = () => {
          clearTimeout(timeout);
          console.log('WebSocket connected');
          
          // Send MQTT CONNECT packet (properly formatted)
          const clientId = "deno-" + Date.now();
          const clientIdBytes = new TextEncoder().encode(clientId);
          
          const connectPacket = new Uint8Array([
            0x10, // CONNECT packet type
            12 + clientIdBytes.length, // Remaining length
            0x00, 0x04, // Protocol name length
            0x4d, 0x51, 0x54, 0x54, // Protocol name "MQTT"
            0x04, // Protocol level 4 (MQTT 3.1.1)
            0x02, // Connect flags (Clean Session)
            0x00, 0x3c, // Keep alive 60s
            0x00, clientIdBytes.length, // Client ID length
            ...clientIdBytes // Client ID
          ]);
          socket.send(connectPacket);
          
          // Wait for CONNACK before sending PUBLISH
          socket.addEventListener('message', (event) => {
            const data = new Uint8Array(event.data);
            // Check if CONNACK received (0x20)
            if (data[0] === 0x20) {
              console.log('CONNACK received, sending PUBLISH');
              
              // Send PUBLISH packet
              const topicBytes = new TextEncoder().encode(topic);
              const messageBytes = new TextEncoder().encode(message);
              
              // Calculate remaining length
              const remainingLength = 2 + topicBytes.length + messageBytes.length;
              
              const publishPacket = new Uint8Array([
                0x30, // PUBLISH packet type (QoS 0)
                remainingLength,
                0x00, topicBytes.length >> 8, // Topic length MSB
                topicBytes.length & 0xFF, // Topic length LSB
                ...topicBytes,
                ...messageBytes
              ]);
              socket.send(publishPacket);
              
              console.log('PUBLISH packet sent');
            }
          });
          
          setTimeout(() => {
            socket.close();
            resolve(true);
          }, 1000);
        };

        socket.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'MQTT message sent via WebSocket',
          details: { url: wsUrl, topic, message }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } catch (wsError) {
      // If WebSocket fails, try HTTP REST API (if broker supports it)
      console.log('WebSocket failed, trying HTTP REST API:', wsError);
      
      // Try HTTP POST to common MQTT REST API endpoints
      const httpUrl = `http://${url}:${port === 1883 ? 8080 : port}/api/v1/publish`;
      
      try {
        const response = await fetch(httpUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            payload: message,
            qos: 0,
            retain: false
          })
        });

        if (response.ok) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'MQTT message sent via HTTP API',
              details: { url: httpUrl, topic, message }
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        }
      } catch (httpError) {
        console.log('HTTP API also failed:', httpError);
      }

      // If both methods fail, return error with instructions
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cannot connect to MQTT broker',
          details: 'กรุณาตรวจสอบ:\n1. MQTT broker ต้องเปิด WebSocket port (8083 หรือ 9001)\n2. หรือเปิด HTTP REST API port (8080)\n3. ตรวจสอบ URL และ Port ให้ถูกต้อง\n4. ตรวจสอบว่า broker อนุญาตการเชื่อมต่อจาก Internet',
          wsError: wsError instanceof Error ? wsError.message : String(wsError),
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

  } catch (error) {
    console.error('Error in MQTT function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
