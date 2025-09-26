import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400"
};
serve(async (req)=>{
  // Handle CORS preflight requests FIRST
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200
    });
  }
  try {
    const { temperature, simulation_id, timestamp, user_email } = await req.json();
    console.log(" Critical temperature alert received:", {
      temperature,
      simulation_id,
      timestamp,
      user_email
    });
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Send email using Supabase's email service
    const { data: emailData, error: emailError } = await supabase.functions.invoke("send-email", {
      body: {
        to: "bokarevk2001@gmail.com",
        subject: " CRITICAL TEMPERATURE ALERT",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;"> CRITICAL TEMPERATURE ALERT</h1>
              </div>
              
              <div style="padding: 20px; background: #f9fafb;">
                <h2 style="color: #dc2626; margin-top: 0;">Temperature Critical: ${temperature}°C</h2>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="margin-top: 0; color: #374151;">Alert Details:</h3>
                  <ul style="color: #6b7280;">
                    <li><strong>Temperature:</strong> ${temperature}°C</li>
                    <li><strong>Status:</strong> CRITICAL</li>
                    <li><strong>Simulation ID:</strong> ${simulation_id}</li>
                    <li><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</li>
                    <li><strong>User:</strong> ${user_email || "Unknown"}</li>
                  </ul>
                </div>
                
                <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="color: #dc2626; margin-top: 0;">⚠️ Immediate Action Required</h3>
                  <p style="color: #7f1d1d; margin: 0;">
                    The temperature has exceeded the critical threshold of 90°C. 
                    Please check the simulation immediately and take appropriate action.
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                  <a href="https://dumudnteqmtvycqdlnbe.supabase.co" 
                     style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    View Dashboard
                  </a>
                </div>
              </div>
              
              <div style="background: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
                <p style="margin: 0;">This is an automated alert from your Temperature Monitoring System</p>
              </div>
            </div>
          `
      }
    });
    if (emailError) {
      console.error("❌ Email sending failed:", emailError);
      throw new Error(`Email sending failed: ${emailError.message}`);
    }
    console.log("✅ Email sent successfully:", emailData);
    return new Response(JSON.stringify({
      success: true,
      message: "Critical temperature alert sent successfully",
      email_id: emailData?.id || "unknown",
      temperature,
      simulation_id,
      timestamp
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error("❌ Error in send-critical-alert:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Failed to send critical alert"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
