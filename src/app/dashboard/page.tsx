"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { SimulationControl } from "@/components/SimulationControl";
import { SimulationStatus } from "@/components/SimulationStatus";
import { ErrorAlert } from "@/components/ErrorAlert";
import { SimulationTimelineChart } from "@/components/SimulationTimelineChart";
import { TemperatureChart } from "@/components/TemperatureChart";
import { TemperatureStats } from "@/components/TemperatureStats";
import { TestEmailButton } from "@/components/TestEmailButton";
import { TemperatureEvent } from "@/types/temperature";

type SimulationStatus = "stopped" | "running";

type SimulationData = {
  id?: string;
  status: SimulationStatus;
  startTime: string | null;
  stopTime: string | null;
  startedBy: string | null;
  stoppedBy: string | null;
  created_at?: string;
  updated_at?: string;
};

type SimulationEvent = {
  id?: string;
  simulation_id: string;
  action_type: "started" | "stopped";
  user_email: string;
  timestamp: string;
  created_at?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [simulation, setSimulation] = useState<SimulationData>({
    status: "stopped",
    startTime: null,
    stopTime: null,
    startedBy: null,
    stoppedBy: null,
  });
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [temperatureEvents, setTemperatureEvents] = useState<
    TemperatureEvent[]
  >([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "SUBSCRIBED"
  >("DISCONNECTED");
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [testResult, setTestResult] = useState<{
    type: "function" | "direct";
    status: "testing" | "success" | "error";
    message: string;
  } | null>(null);

  const [emailTestResult, setEmailTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // Auto-clear email test result after 10 seconds
  useEffect(() => {
    if (emailTestResult) {
      const timer = setTimeout(() => {
        setEmailTestResult(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [emailTestResult]);

  // Function to refresh simulation data
  const refreshSimulationData = useCallback(async () => {
    try {
      const { data: events, error: eventError } = await supabase
        .from("simulation_events")
        .select("*")
        .order("timestamp", { ascending: false });

      if (eventError) {
        console.error("Error loading simulation events:", eventError);
        return;
      }

      // Store all events for the chart
      setAllEvents(events || []);

      if (events && events.length > 0) {
        const latestEvent = events[0];

        if (latestEvent.event_type === "simulation_started") {
          // If the latest event is "simulation_started", simulation is running
          setSimulation({
            status: "running",
            startTime: new Date(latestEvent.timestamp).toLocaleString(),
            stopTime: null,
            startedBy: latestEvent.user_id,
            stoppedBy: null,
          });
        } else if (latestEvent.event_type === "simulation_stopped") {
          // If the latest event is "simulation_stopped", simulation is stopped
          // Find the corresponding start event
          const startEvent = events.find(
            (event) => event.event_type === "simulation_started"
          );

          setSimulation({
            status: "stopped",
            startTime: startEvent
              ? new Date(startEvent.timestamp).toLocaleString()
              : null,
            stopTime: new Date(latestEvent.timestamp).toLocaleString(),
            startedBy: startEvent ? startEvent.user_id : null,
            stoppedBy: latestEvent.user_id,
          });
        }
      } else {
        setSimulation({
          status: "stopped",
          startTime: null,
          stopTime: null,
          startedBy: null,
          stoppedBy: null,
        });
      }
    } catch (error) {
      console.error("Error refreshing simulation data:", error);
    }
  }, []);

  const refreshTemperatureData = useCallback(async () => {
    try {
      console.log("🌡️ Refreshing temperature data...");

      // Fetch all temperature events
      const { data: events, error: eventsError } = await supabase
        .from("checkup_events")
        .select("*")
        .order("timestamp", { ascending: true });

      if (eventsError) {
        console.error("❌ Error fetching temperature events:", eventsError);
        return;
      }

      console.log("🌡️ Fetched temperature events:", events);
      setTemperatureEvents(events || []);
    } catch (error) {
      console.error("❌ Error refreshing temperature data:", error);
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentUser) return;

    console.log("Setting up real-time subscription...");
    setConnectionStatus("CONNECTING");

    const channel = supabase
      .channel("simulation_events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "simulation_events",
        },
        async (payload) => {
          console.log("Real-time event received:", payload);
          console.log("Event type:", payload.new?.event_type);
          console.log("User ID:", payload.new?.user_id);
          console.log("Timestamp:", payload.new?.timestamp);

          // Refresh data when new event is inserted
          console.log("Refreshing simulation data...");
          await refreshSimulationData();
          console.log("Simulation data refreshed");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "checkup_events",
        },
        async (payload) => {
          console.log("Temperature event received:", payload);
          console.log("Temperature:", payload.new?.temperature);
          console.log("Status:", payload.new?.status);
          console.log("Timestamp:", payload.new?.timestamp);

          // Refresh temperature data when new event is inserted
          console.log("Refreshing temperature data...");
          await refreshTemperatureData();
          console.log("Temperature data refreshed");
        }
      )
      .subscribe((status) => {
        console.log("Real-time subscription status:", status);
        setConnectionStatus(
          status as "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "SUBSCRIBED"
        );
      });

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up real-time subscription...");
      supabase.removeChannel(channel);
    };
  }, [currentUser, refreshSimulationData]);

  // Fallback polling when disconnected
  useEffect(() => {
    if (connectionStatus === "DISCONNECTED" && currentUser) {
      console.log("Starting fallback polling...");
      const interval = setInterval(() => {
        refreshSimulationData();
        refreshTemperatureData();
      }, 5000); // Poll every 5 seconds

      setPollingInterval(interval);
    } else {
      // Clear polling when connected
      if (pollingInterval) {
        console.log("Stopping fallback polling...");
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }

    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [connectionStatus, currentUser]);

  useEffect(() => {
    // Get current user and load simulation status
    const initializeData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user.email || "Unknown User");
        } else {
          router.replace("/login");
          return;
        }

        // Refresh simulation data
        await refreshSimulationData();
        // Refresh temperature data
        await refreshTemperatureData();
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };
    initializeData();
  }, []);

  const startSimulation = async () => {
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const now = new Date().toLocaleString();

      // Save simulation event to database using the validation function
      const { data: result, error: eventError } = await supabase.rpc(
        "insert_simulation_event",
        {
          p_event_type: "simulation_started",
          p_user_id: currentUser,
        }
      );

      if (eventError) {
        throw eventError;
      }

      if (result && !result.success) {
        // If there's a validation error, refresh the data to show current state
        await refreshSimulationData();
        throw new Error(result.error);
      }

      // Refresh simulation data to get complete status
      await refreshSimulationData();
    } catch (error: any) {
      console.error("Error starting simulation:", error);
      setError(error.message || "Failed to start simulation");

      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const stopSimulation = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    try {
      const now = new Date().toLocaleString();

      // Save simulation event to database using the validation function
      const { data: result, error: eventError } = await supabase.rpc(
        "insert_simulation_event",
        {
          p_event_type: "simulation_stopped",
          p_user_id: currentUser,
        }
      );

      if (eventError) {
        throw eventError;
      }

      if (result && !result.success) {
        // If there's a validation error, refresh the data to show current state
        await refreshSimulationData();
        throw new Error(result.error);
      }

      // Refresh simulation data to get complete status
      await refreshSimulationData();
    } catch (error: any) {
      console.error("Error stopping simulation:", error);
      setError(error.message || "Failed to stop simulation");

      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-gray-400">
                Monitor and control your simulation processes
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    connectionStatus === "CONNECTED" ||
                    connectionStatus === "SUBSCRIBED"
                      ? "bg-green-500"
                      : connectionStatus === "CONNECTING"
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-300">
                  {connectionStatus === "CONNECTED" && "Real-time active"}
                  {connectionStatus === "SUBSCRIBED" && "Real-time active"}
                  {connectionStatus === "CONNECTING" && "Connecting..."}
                  {connectionStatus === "DISCONNECTED" && "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm shadow-xl border border-gray-700/50 mt-6">
            <div className="flex justify-between items-start">
              <div>
                <button
                  onClick={refreshSimulationData}
                  className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors self-start"
                >
                  Refresh Data
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Security Testing Tools
                </h4>

                {/* Function Test Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setTestResult({
                        type: "function",
                        status: "testing",
                        message: "Testing function validation...",
                      });

                      const { data: result, error } = await supabase.rpc(
                        "insert_simulation_event",
                        {
                          p_event_type: "simulation_started",
                          p_user_id: currentUser,
                        }
                      );

                      console.log("Function test result:", { result, error });

                      if (result && result.success) {
                        console.log(
                          "Event inserted successfully via function",
                          result
                        );
                        setTestResult({
                          type: "function",
                          status: "success",
                          message:
                            "✅ Function validation passed - Event inserted successfully",
                        });
                      } else {
                        console.log(
                          "Function validation prevented duplicate:",
                          result?.error
                        );
                        setTestResult({
                          type: "function",
                          status: "error",
                          message: `❌ Function validation blocked: ${
                            result?.error || "Unknown error"
                          }`,
                        });
                      }

                      // Clear result after 5 seconds
                      setTimeout(() => setTestResult(null), 5000);
                    }}
                    className="px-4 py-3 text-sm font-medium text-blue-100 bg-gradient-to-r from-blue-600/80 to-blue-700/80 backdrop-blur-sm border border-blue-500/50 rounded-lg hover:from-blue-500/80 hover:to-blue-600/80 hover:border-blue-400/50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center gap-3"
                  >
                    <span>Test Function Validation</span>
                    <div className="group relative">
                      <svg
                        className="w-4 h-4 text-blue-400 cursor-help"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        <div className="font-semibold mb-1">
                          Function Validation Test
                        </div>
                        <div>
                          Tests our website's frontend logic using the
                          insert_simulation_event function. This is the proper
                          way to add events with full validation and error
                          handling.
                        </div>
                      </div>
                    </div>
                  </button>

                  {testResult?.type === "function" && (
                    <div
                      className={`text-sm px-4 py-3 rounded-lg font-medium shadow-lg transition-all duration-300 flex items-center gap-2 ${
                        testResult.status === "success"
                          ? "bg-green-900/80 text-green-200 border border-green-700/50"
                          : testResult.status === "error"
                          ? "bg-red-900/80 text-red-200 border border-red-700/50"
                          : "bg-yellow-900/80 text-yellow-200 border border-yellow-700/50"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          testResult.status === "success"
                            ? "bg-green-400"
                            : testResult.status === "error"
                            ? "bg-red-400"
                            : "bg-yellow-400 animate-pulse"
                        }`}
                      ></div>
                      {testResult.message}
                    </div>
                  )}
                </div>

                {/* Direct Insert Test Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setTestResult({
                        type: "direct",
                        status: "testing",
                        message: "Testing direct insert...",
                      });

                      const { data, error } = await supabase
                        .from("simulation_events")
                        .insert({
                          event_type: "simulation_started",
                          user_id: currentUser,
                        });

                      console.log("Direct insert test:", { data, error });

                      if (error) {
                        console.log(
                          "Direct insert blocked by RLS:",
                          error.message
                        );
                        setTestResult({
                          type: "direct",
                          status: "success",
                          message:
                            "✅ RLS Security Working - Direct insert blocked by database policy",
                        });
                      } else {
                        console.log("Direct insert succeeded");
                        setTestResult({
                          type: "direct",
                          status: "error",
                          message:
                            "❌ SECURITY ISSUE - Direct insert succeeded (RLS validation failed!)",
                        });
                      }

                      // Clear result after 5 seconds
                      setTimeout(() => setTestResult(null), 5000);
                    }}
                    className="px-4 py-3 text-sm font-medium text-red-100 bg-gradient-to-r from-red-600/80 to-red-700/80 backdrop-blur-sm border border-red-500/50 rounded-lg hover:from-red-500/80 hover:to-red-600/80 hover:border-red-400/50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center gap-3"
                  >
                    <span>Test Direct Insert Security</span>
                    <div className="group relative">
                      <svg
                        className="w-4 h-4 text-red-400 cursor-help"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        <div className="font-semibold mb-1">
                          Database Security Test
                        </div>
                        <div>
                          Tests if someone tries to bypass our validation by
                          inserting directly into the database (e.g., using
                          Postman, direct API calls). Should be blocked by Row
                          Level Security (RLS) policies.
                        </div>
                      </div>
                    </div>
                  </button>

                  {testResult?.type === "direct" && (
                    <div
                      className={`text-sm px-4 py-3 rounded-lg font-medium shadow-lg transition-all duration-300 flex items-center gap-2 ${
                        testResult.status === "success"
                          ? "bg-green-900/80 text-green-200 border border-green-700/50"
                          : testResult.status === "error"
                          ? "bg-red-900/80 text-red-200 border border-red-700/50"
                          : "bg-yellow-900/80 text-yellow-200 border border-yellow-700/50"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          testResult.status === "success"
                            ? "bg-green-400"
                            : testResult.status === "error"
                            ? "bg-red-400"
                            : "bg-yellow-400 animate-pulse"
                        }`}
                      ></div>
                      {testResult.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <ErrorAlert error={error} />

          {/* Real-time Disconnection Warning */}
          {connectionStatus === "DISCONNECTED" && (
            <div className="rounded-lg bg-yellow-900/20 border border-yellow-500/30 p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <p className="text-sm text-yellow-300">
                  Real-time updates disconnected. Data may be outdated.
                  Refreshing...
                </p>
              </div>
            </div>
          )}

          <SimulationControl
            status={simulation.status}
            loading={loading}
            onStart={startSimulation}
            onStop={stopSimulation}
          />

          <SimulationStatus simulation={simulation} />

          <SimulationTimelineChart events={allEvents} />

          {/* Temperature Monitoring Section */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
                  🌡️ Temperature Monitoring
                </h2>
                <p className="text-gray-400">
                  Real-time temperature readings from active simulation
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {temperatureEvents.length} readings
                </div>
                <TestEmailButton onTestComplete={setEmailTestResult} />
              </div>
            </div>

            {/* Email Test Result */}
            {emailTestResult && (
              <div className="mb-4 p-4 rounded-lg border-l-4 bg-gray-800/50">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      emailTestResult.success ? "bg-green-400" : "bg-red-400"
                    }`}
                  ></div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        emailTestResult.success
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {emailTestResult.message}
                    </p>
                    {emailTestResult.details && (
                      <p className="text-sm text-gray-400 mt-1">
                        {typeof emailTestResult.details === "string"
                          ? emailTestResult.details
                          : JSON.stringify(emailTestResult.details, null, 2)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setEmailTestResult(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Temperature Statistics */}
            <TemperatureStats events={temperatureEvents} />

            {/* Temperature Chart */}
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Temperature Chart
                </h3>
                <div className="text-sm text-gray-400">
                  Last 20 readings • Updates every minute
                </div>
              </div>
              <TemperatureChart events={temperatureEvents} showLastN={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
