import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckupEvent {
  checkup_id: string;
  timestamp: string;
  temperature: number;
  status: "normal" | "critical";
  simulation_id: string;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🌡️ Starting temperature generation check...");

    // Check if simulation is currently running
    const { data: activeSimId, error: simError } = await supabase.rpc(
      "get_active_simulation_id"
    );

    if (simError) {
      console.error("❌ Error checking active simulation:", simError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to check simulation status",
          details: simError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!activeSimId) {
      console.log(
        "⏸️ No active simulation found, skipping temperature generation"
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active simulation, temperature generation skipped",
          activeSimulation: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ Active simulation found: ${activeSimId}`);

    // Generate random temperature (0-100)
    const temperature = Math.floor(Math.random() * 101);
    console.log(`🌡️ Generated temperature: ${temperature}°C`);

    // Insert checkup event using our database function
    const { data: insertResult, error: insertError } = await supabase.rpc(
      "insert_checkup_event",
      {
        p_temperature: temperature,
        p_simulation_id: activeSimId,
      }
    );

    if (insertError) {
      console.error("❌ Error inserting checkup event:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to insert checkup event",
          details: insertError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Checkup event inserted successfully:", insertResult);

    // Check if temperature is critical and send email alert
    if (temperature >= 90) {
      console.log("🚨 CRITICAL TEMPERATURE DETECTED! Sending email alert...");

      try {
        // Send email using Supabase Edge Function email service
        const { data: emailData, error: emailError } =
          await supabase.functions.invoke("send-critical-alert", {
            body: {
              temperature,
              simulation_id: activeSimId,
              timestamp: new Date().toISOString(),
            },
          });

        if (emailError) {
          console.error("❌ Error sending email alert:", emailError);
          // Don't fail the entire request if email fails
        } else {
          console.log("✅ Email alert sent successfully");
        }
      } catch (emailErr) {
        console.error("❌ Error calling email function:", emailErr);
        // Don't fail the entire request if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Temperature generated and logged successfully",
        data: {
          temperature,
          status: temperature >= 90 ? "critical" : "normal",
          simulation_id: activeSimId,
          timestamp: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
