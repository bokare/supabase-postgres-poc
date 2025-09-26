import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CriticalAlertData {
  temperature: number;
  simulation_id: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { temperature, simulation_id, timestamp }: CriticalAlertData =
      await req.json();

    console.log(`🚨 Sending critical temperature alert: ${temperature}°C`);

    // Admin email address
    const adminEmail = "bokarevk2001@gmail.com";

    // Format timestamp
    const alertTime = new Date(timestamp).toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Email content
    const subject = `🚨 CRITICAL TEMPERATURE ALERT - ${temperature}°C`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Critical Temperature Alert</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { padding: 30px; }
          .alert-box { background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .temperature { font-size: 48px; font-weight: bold; color: #dc2626; text-align: center; margin: 20px 0; }
          .details { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { background: #f3f4f6; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 CRITICAL TEMPERATURE ALERT</h1>
            <p>Immediate attention required</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <h2>Temperature Exceeded Critical Threshold</h2>
              <div class="temperature">${temperature}°C</div>
              <p style="text-align: center; color: #dc2626; font-weight: bold;">
                ⚠️ Temperature is above 90°C - Critical Level Reached
              </p>
            </div>
            
            <div class="details">
              <h3>Alert Details:</h3>
              <ul>
                <li><strong>Temperature:</strong> ${temperature}°C</li>
                <li><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">CRITICAL</span></li>
                <li><strong>Simulation ID:</strong> ${simulation_id}</li>
                <li><strong>Alert Time:</strong> ${alertTime} UTC</li>
                <li><strong>Threshold:</strong> 90°C</li>
              </ul>
            </div>

            <div class="details">
              <h3>Recommended Actions:</h3>
              <ul>
                <li>Immediately check the simulation system</li>
                <li>Verify temperature sensors are functioning correctly</li>
                <li>Consider stopping the simulation if necessary</li>
                <li>Monitor the system closely for any further alerts</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated alert from the Temperature Monitoring System</p>
            <p>Please acknowledge this alert by checking the dashboard</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
CRITICAL TEMPERATURE ALERT

Temperature: ${temperature}°C
Status: CRITICAL
Simulation ID: ${simulation_id}
Alert Time: ${alertTime} UTC
Threshold: 90°C

This temperature exceeds the critical threshold of 90°C. 
Please check the simulation system immediately.

Recommended Actions:
- Check the simulation system
- Verify temperature sensors
- Consider stopping simulation if necessary
- Monitor system closely

This is an automated alert from the Temperature Monitoring System.
Please acknowledge this alert by checking the dashboard.
    `;

    // Send email using Supabase's built-in email service
    // Note: This requires Supabase email service to be configured
    const emailResponse = await fetch(
      "https://api.supabase.com/v1/projects/" +
        Deno.env.get("SUPABASE_PROJECT_ID") +
        "/emails",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: [adminEmail],
          subject: subject,
          html: htmlContent,
          text: textContent,
        }),
      }
    );

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("❌ Email sending failed:", errorText);

      // Fallback: Log the alert for manual sending
      console.log("📧 Email content for manual sending:");
      console.log("To:", adminEmail);
      console.log("Subject:", subject);
      console.log("Body:", textContent);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Email sending failed",
          details: errorText,
          fallback: {
            to: adminEmail,
            subject: subject,
            body: textContent,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailResult = await emailResponse.json();
    console.log("✅ Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Critical temperature alert sent successfully",
        data: {
          temperature,
          simulation_id,
          timestamp,
          email_sent: true,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error sending critical alert:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to send critical alert",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
