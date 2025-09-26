"use client";
import { TemperatureEvent, TemperatureStats } from "@/types/temperature";
import { useState, useEffect } from "react";

interface TemperatureStatsProps {
  events: TemperatureEvent[];
}

export function TemperatureStats({ events }: TemperatureStatsProps) {
  const [stats, setStats] = useState<TemperatureStats>({
    current: 0,
    average: 0,
    min: 0,
    max: 0,
    critical_count: 0,
    normal_count: 0,
    last_updated: "",
  });

  useEffect(() => {
    if (!events || events.length === 0) {
      setStats({
        current: 0,
        average: 0,
        min: 0,
        max: 0,
        critical_count: 0,
        normal_count: 0,
        last_updated: "",
      });
      return;
    }

    const temperatures = events.map((e) => e.temperature);
    const criticalEvents = events.filter((e) => e.status === "critical");
    const normalEvents = events.filter((e) => e.status === "normal");

    const newStats: TemperatureStats = {
      current: temperatures[temperatures.length - 1] || 0,
      average: Math.round(
        temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length
      ),
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
      critical_count: criticalEvents.length,
      normal_count: normalEvents.length,
      last_updated: events[events.length - 1]?.timestamp || "",
    };

    setStats(newStats);
  }, [events]);

  const getCurrentStatusColor = () => {
    if (stats.current >= 90) return "text-red-400";
    if (stats.current >= 80) return "text-yellow-400";
    return "text-green-400";
  };

  const getCurrentStatusText = () => {
    if (stats.current >= 90) return "CRITICAL";
    if (stats.current >= 80) return "WARNING";
    return "NORMAL";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Current Temperature */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Current</p>
            <p className={`text-2xl font-bold ${getCurrentStatusColor()}`}>
              {stats.current}°C
            </p>
            <p className={`text-xs font-medium ${getCurrentStatusColor()}`}>
              {getCurrentStatusText()}
            </p>
          </div>
          <div className="text-2xl">🌡️</div>
        </div>
      </div>

      {/* Average Temperature */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Average</p>
            <p className="text-2xl font-bold text-blue-400">
              {stats.average}°C
            </p>
            <p className="text-xs text-gray-500">All readings</p>
          </div>
          <div className="text-2xl">📊</div>
        </div>
      </div>

      {/* Min/Max Range */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Range</p>
            <p className="text-lg font-bold text-green-400">
              {stats.min}°C - {stats.max}°C
            </p>
            <p className="text-xs text-gray-500">Min - Max</p>
          </div>
          <div className="text-2xl">📈</div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Alerts</p>
            <p className="text-lg font-bold text-red-400">
              {stats.critical_count}
            </p>
            <p className="text-xs text-gray-500">
              {stats.normal_count} normal
            </p>
          </div>
          <div className="text-2xl">⚠️</div>
        </div>
      </div>
    </div>
  );
}
