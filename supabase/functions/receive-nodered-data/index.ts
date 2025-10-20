import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received Node-RED data request");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Parse JSON data from Node-RED
    const requestData = await req.json();
    
    const temperature = parseFloat(requestData.temperature || "0");
    const humidity = parseFloat(requestData.humidity || "0");
    const soil_moisture = parseFloat(requestData.soil_moisture || "0");

    console.log("Node-RED data:", { temperature, humidity, soil_moisture });

    // Insert sensor data into database
    const { data: insertData, error: insertError } = await supabase
      .from("sensor_data")
      .insert({
        temperature,
        humidity,
        soil_moisture,
        nitrogen_value: null,
        phosphorus_value: null,
        potassium_value: null,
        auto_message: null,
        audio_url: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error(`Failed to insert sensor data: ${insertError.message}`);
    }

    console.log("Node-RED data saved successfully:", insertData.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Node-RED data received and saved successfully",
        data: {
          id: insertData.id,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error processing request:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
