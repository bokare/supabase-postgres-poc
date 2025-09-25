"use client";
import { useState } from "react";

type SimulationStatus = "stopped" | "running";

interface SimulationControlProps {
  status: SimulationStatus;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function SimulationControl({
  status,
  loading,
  onStart,
  onStop,
}: SimulationControlProps) {
  return (
    <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm shadow-xl border border-gray-700/50">
      <h2 className="text-xl font-semibold text-white mb-4">
        Simulation Control
      </h2>

      <div className="flex flex-col sm:flex-row gap-4">
        {status === "stopped" && (
          <button
            onClick={onStart}
            disabled={loading}
            className="flex items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-green-700 hover:to-emerald-700 hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <span>{loading ? "Starting..." : "Start Simulation"}</span>
          </button>
        )}

        {status === "running" && (
          <button
            onClick={onStop}
            disabled={loading}
            className="flex items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-red-700 hover:to-rose-700 hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10h6v4H9z"
                />
              </svg>
            )}
            <span>{loading ? "Stopping..." : "Stop Simulation"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
