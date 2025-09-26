"use client";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { TemperatureEvent, TemperatureChartData } from "@/types/temperature";

interface TemperatureChartProps {
  events: TemperatureEvent[];
  chartType?: "line" | "area" | "bar";
  showLastN?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export function TemperatureChart({
  events,
  chartType = "line",
  showLastN = 20,
  dateRange,
}: TemperatureChartProps) {
  const [chartData, setChartData] = useState<TemperatureChartData[]>([]);

  useEffect(() => {
    if (!events || events.length === 0) {
      setChartData([]);
      return;
    }

    let filteredEvents = [...events];

    // Filter by date range if provided
    if (dateRange) {
      filteredEvents = filteredEvents.filter((event) => {
        const eventDate = new Date(event.timestamp);
        return eventDate >= dateRange.start && eventDate <= dateRange.end;
      });
    }

    // Sort by timestamp and take last N events
    const sortedEvents = filteredEvents
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-showLastN);

    // Convert to chart data
    const data: TemperatureChartData[] = sortedEvents.map((event) => ({
      time: new Date(event.timestamp).toLocaleTimeString(),
      timestamp: new Date(event.timestamp).getTime(),
      temperature: event.temperature,
      status: event.status,
      simulation_id: event.simulation_id,
    }));

    setChartData(data);
  }, [events, showLastN, dateRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-gray-300 mb-1">
            <strong>Time:</strong> {label}
          </p>
          <p className="text-sm text-gray-300 mb-1">
            <strong>Temperature:</strong>{" "}
            <span
              className={
                data.status === "critical"
                  ? "text-red-400 font-bold"
                  : "text-green-400"
              }
            >
              {data.temperature}°C
            </span>
          </p>
          <p className="text-sm text-gray-300 mb-1">
            <strong>Status:</strong>{" "}
            <span
              className={
                data.status === "critical"
                  ? "text-red-400 font-bold"
                  : "text-green-400"
              }
            >
              {data.status.toUpperCase()}
            </span>
          </p>
          <p className="text-xs text-gray-400">
            Simulation: {data.simulation_id}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800/30 rounded-lg border border-gray-700/50">
        <div className="text-center">
          <div className="text-gray-400 mb-2">🌡️</div>
          <p className="text-gray-400">No temperature data available</p>
          <p className="text-sm text-gray-500">
            Start a simulation to see temperature readings
          </p>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={11}
              domain={[0, 100]}
              tickCount={11}
              tickFormatter={(value) => `${value}°C`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#3B82F6"
              fill="url(#temperatureGradient)"
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="temperatureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={11}
              domain={[0, 100]}
              tickCount={11}
              tickFormatter={(value) => `${value}°C`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="temperature"
              fill="#3B82F6"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={11}
              domain={[0, 100]}
              tickCount={11}
              tickFormatter={(value) => `${value}°C`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
