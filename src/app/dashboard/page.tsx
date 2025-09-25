"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { SimulationControl } from "@/components/SimulationControl";
import { SimulationStatus } from "@/components/SimulationStatus";
import { ErrorAlert } from "@/components/ErrorAlert";
import { SimulationTimelineChart } from "@/components/SimulationTimelineChart";

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
  const [connectionStatus, setConnectionStatus] = useState<
    "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "SUBSCRIBED"
  >("DISCONNECTED");
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

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

            {/* Real-time Connection Status */}
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

              {/* Debug buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={refreshSimulationData}
                  className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={async () => {
                    // Test using the validation function to see if real-time works
                    const { data: result, error } = await supabase.rpc(
                      "insert_simulation_event",
                      {
                        p_event_type: "simulation_started",
                        p_user_id: currentUser,
                      }
                    );
                    console.log("Function test result:", { result, error });
                    if (result && result.success) {
                      console.log("Event inserted successfully via function");
                    } else {
                      console.log(
                        "Function validation prevented duplicate:",
                        result?.error
                      );
                    }
                  }}
                  className="px-3 py-1 text-xs bg-blue-700 text-blue-300 rounded hover:bg-blue-600 transition-colors"
                >
                  Test RT (Function)
                </button>

                <button
                  onClick={async () => {
                    // Test direct insert to bypass validation (for testing purposes)
                    const { data, error } = await supabase
                      .from("simulation_events")
                      .insert({
                        event_type: "simulation_started",
                        user_id: currentUser,
                      });
                    console.log("Direct insert test:", { data, error });
                    if (error) {
                      console.log("Direct insert failed:", error.message);
                    } else {
                      console.log(
                        "Direct insert succeeded - this bypasses validation!"
                      );
                    }
                  }}
                  className="px-3 py-1 text-xs bg-red-700 text-red-300 rounded hover:bg-red-600 transition-colors"
                >
                  Test RT (Direct)
                </button>
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
        </div>
      </div>
    </div>
  );
}
