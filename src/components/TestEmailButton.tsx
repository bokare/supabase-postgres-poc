"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface TestEmailButtonProps {
  onTestComplete: (result: {
    success: boolean;
    message: string;
    details?: any;
  }) => void;
}

export function TestEmailButton({ onTestComplete }: TestEmailButtonProps) {
  const [loading, setLoading] = useState(false);

  const testCriticalEmail = async () => {
    setLoading(true);
    try {
      console.log("🧪 Testing critical email alert...");

      // Insert a critical temperature record directly
      const { data, error } = await supabase
        .from("checkup_events")
        .insert({
          temperature: 95, // Critical temperature
          status: "critical",
          simulation_id: "test-email-" + Date.now(),
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Error inserting test record:", error);
        onTestComplete({
          success: false,
          message: "Failed to insert test record",
          details: error.message,
        });
        return;
      }

      console.log("✅ Test record inserted:", data);

      // Call the send-critical-alert Edge Function using supabase.functions.invoke()
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userEmail = user?.email || "test@example.com";

      console.log("📧 Calling send-critical-alert Edge Function...");

      const { data: result, error: functionError } =
        await supabase.functions.invoke("-send-critical-alert", {
          body: {
            temperature: 95,
            simulation_id: data.simulation_id,
            timestamp: data.timestamp,
            user_email: userEmail,
          },
        });

      console.log("📧 Email alert result:", result);
      console.log("📧 Email alert error:", functionError);

      if (functionError) {
        onTestComplete({
          success: false,
          message: "Failed to send email alert",
          details: functionError.message || "Unknown error",
        });
      } else if (result && result.success) {
        onTestComplete({
          success: true,
          message: "Critical email alert sent successfully!",
          details: {
            temperature: 95,
            status: "critical",
            email_sent: true,
            recipient: "bokarevk2001@gmail.com",
            email_id: result.email_id,
          },
        });
      } else {
        onTestComplete({
          success: false,
          message: "Failed to send email alert",
          details: result?.error || "Unknown error",
        });
      }
    } catch (error: any) {
      console.log("❌ Test email error:", error);
      onTestComplete({
        success: false,
        message: "Test failed with error",
        details: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={testCriticalEmail}
        disabled={loading}
        className={`
          px-4 py-2 rounded-lg font-medium transition-all duration-200
          ${
            loading
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-600/25"
          }
        `}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Testing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span>📧</span>
            <span>Test Critical Email</span>
          </div>
        )}
      </button>

      {/* Info Icon with Tooltip */}
      <div className="relative group">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center cursor-help">
          <span className="text-white text-xs font-bold">i</span>
        </div>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          <div className="text-center">
            <div className="font-semibold mb-1">Test Critical Email Alert</div>
            <div className="text-xs text-gray-300">
              Inserts a critical temperature record (95°C) and sends email to
              admin
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Recipient: bokarevk2001@gmail.com
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    </div>
  );
}
