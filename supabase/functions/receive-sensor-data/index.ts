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
    console.log("Received sensor data request");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Parse multipart form data
    const formData = await req.formData();
    
    // Extract sensor values
    const temperature = parseFloat(formData.get("temperature") as string || "0");
    const humidity = parseFloat(formData.get("humidity") as string || "0");
    const soil_moisture = parseFloat(formData.get("soil_moisture") as string || "0");
    const nitrogen_value = parseFloat(formData.get("nitrogen") as string || "0");
    const phosphorus_value = parseFloat(formData.get("phosphorus") as string || "0");
    const potassium_value = parseFloat(formData.get("potassium") as string || "0");
    const auto_message = formData.get("auto_message") as string || "";
    
    let audioUrl = null;

    // Handle audio file if present
    const audioFile = formData.get("audio_file") as File;
    if (audioFile && audioFile.size > 0) {
      console.log("Processing audio file:", audioFile.name, "Size:", audioFile.size);

      // Generate unique filename
      const timestamp = new Date().getTime();
      const fileExt = audioFile.name.split(".").pop() || "mp3";
      const fileName = `sensor_audio_${timestamp}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Convert File to ArrayBuffer
      const arrayBuffer = await audioFile.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("audio-files")
        .upload(filePath, fileBuffer, {
          contentType: audioFile.type || "audio/mpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Failed to upload audio file: ${uploadError.message}`);
      }

      console.log("Audio uploaded successfully:", uploadData.path);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("audio-files")
        .getPublicUrl(filePath);

      audioUrl = urlData.publicUrl;
      console.log("Audio public URL:", audioUrl);
    }

    // Insert sensor data into database
    const { data: insertData, error: insertError } = await supabase
      .from("sensor_data")
      .insert({
        temperature,
        humidity,
        soil_moisture,
        nitrogen_value,
        phosphorus_value,
        potassium_value,
        auto_message,
        audio_url: audioUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error(`Failed to insert sensor data: ${insertError.message}`);
    }

    console.log("Sensor data saved successfully:", insertData.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sensor data received and saved successfully",
        data: {
          id: insertData.id,
          audio_url: audioUrl,
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
