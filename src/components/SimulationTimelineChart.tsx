"use client";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";

interface SimulationEvent {
  event_id: string;
  timestamp: string;
  event_type: "simulation_started" | "simulation_stopped";
  user_id: string;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  status: number; // 1 for running, 0 for stopped
  event: string;
  user: string;
}

interface SimulationTimelineChartProps {
  events: SimulationEvent[];
}

export function SimulationTimelineChart({
  events,
}: SimulationTimelineChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("line");

  useEffect(() => {
    if (!events || events.length === 0) {
      setChartData([]);
      return;
    }

    // Sort events by timestamp
    const sortedEvents = [...events].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const data: ChartDataPoint[] = [];
    let currentStatus = 0; // Start as stopped

    // Create data points for each event timestamp
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const timestamp = new Date(event.timestamp);
      const timeLabel = timestamp.toLocaleString();

      // Add point at the moment of status change (showing previous status)
      data.push({
        time: timeLabel,
        timestamp: timestamp.getTime(),
        status: event.event_type === "simulation_started" ? 1 : 0,
        event: event.event_type === "simulation_started" ? "Start" : "Stop",
        user: event.user_id,
      });

      // Update status
      currentStatus = event.event_type === "simulation_started" ? 1 : 0;

      // Add point immediately after status change to show new status
      // data.push({
      //   time: timeLabel,
      //   timestamp: timestamp.getTime() + 1, // Add 1ms to show the new status
      //   status: currentStatus,
      //   event:
      //     event.event_type === "simulation_started" ? "Started" : "Stopped",
      //   user: event.user_id,
      // });
    }

    setChartData(data);
  }, [events]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{`Time: ${label}`}</p>
          <p className="text-blue-400">{`Status: ${data.event}`}</p>
          <p className="text-green-400">{`User: ${data.user}`}</p>
          <p className="text-yellow-400">{`Value: ${
            data.status === 1 ? "Running" : "Stopped"
          }`}</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm shadow-xl border border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">
          Simulation Timeline
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No simulation data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm shadow-xl border border-gray-700/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">
          Simulation Timeline
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType("line")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === "line"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType("area")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === "area"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Area
          </button>
          {/* <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === "bar"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Bar
          </button> */}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9CA3AF"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 10 }}
                tickFormatter={(value, index) => {
                  // Only show timestamp for even indices (before status change)
                  // return index % 2 === 0 ? value : "";
                  return value;
                }}
              />
              <YAxis
                stroke="#9CA3AF"
                domain={[0, 1]}
                ticks={[0, 1]}
                tickFormatter={(value) => (value === 1 ? "Running" : "Stopped")}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="stepAfter"
                dataKey="status"
                stroke="#3B82F6"
                strokeWidth={4}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: "#3B82F6", strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          ) : chartType === "area" ? (
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9CA3AF"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 10 }}
                tickFormatter={(value, index) => {
                  // Only show timestamp for even indices (before status change)
                  // return index % 2 === 0 ? value : "";
                  return value;
                }}
              />
              <YAxis
                stroke="#9CA3AF"
                domain={[0, 1]}
                ticks={[0, 1]}
                tickFormatter={(value) => (value === 1 ? "Running" : "Stopped")}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="stepAfter"
                dataKey="status"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
                strokeWidth={3}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9CA3AF"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 10 }}
                tickFormatter={(value, index) => {
                  // Only show timestamp for even indices (before status change)
                  // return index % 2 === 0 ? value : "";
                  return value;
                }}
              />
              <YAxis
                stroke="#9CA3AF"
                domain={[0, 1]}
                ticks={[0, 1]}
                tickFormatter={(value) => (value === 1 ? "Running" : "Stopped")}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="status"
                fill="#3B82F6"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-300">Running (1)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span className="text-gray-300">Stopped (0)</span>
        </div>
      </div>
    </div>
  );
}
