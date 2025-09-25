"use client";
import { useState, useEffect } from "react";
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

  console.log("simulation", simulation);

  // Function to refresh simulation data
  const refreshSimulationData = async () => {
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
  };

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
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Monitor and control your simulation processes
          </p>
        </div>

        <div className="grid gap-6">
          <ErrorAlert error={error} />

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
