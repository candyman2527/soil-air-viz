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
    const { url, port, message } = await req.json();

    console.log('Connecting to WebSocket:', { url, port, message });

    // Connect to WebSocket server
    const wsUrl = `ws://${url}:${port}`;
    
    try {
      const socket = new WebSocket(wsUrl);
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.close();
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        socket.onopen = () => {
          clearTimeout(timeout);
          console.log('WebSocket connected to:', wsUrl);
          
          // Send message directly
          socket.send(message);
          console.log('Message sent:', message);
          
          // Close connection after sending
          setTimeout(() => {
            socket.close();
            resolve(true);
          }, 1000);
        };

        socket.onerror = (error) => {
          clearTimeout(timeout);
          console.error('WebSocket error:', error);
          reject(error);
        };

        socket.onclose = () => {
          console.log('WebSocket closed');
        };
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'ส่งข้อความผ่าน WebSocket สำเร็จ',
          details: { url: wsUrl, message }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } catch (wsError) {
      console.error('WebSocket connection failed:', wsError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'ไม่สามารถเชื่อมต่อ WebSocket ได้',
          details: `กรุณาตรวจสอบ:\n1. URL และ Port ให้ถูกต้อง\n2. WebSocket server ต้องเปิดอยู่\n3. ตรวจสอบว่า server อนุญาตการเชื่อมต่อจาก Internet`,
          wsError: wsError instanceof Error ? wsError.message : String(wsError),
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

  } catch (error) {
    console.error('Error in WebSocket function:', error);
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
