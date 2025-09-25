"use client";

type SimulationStatus = "stopped" | "running";

interface SimulationData {
  status: SimulationStatus;
  startTime: string | null;
  stopTime: string | null;
  startedBy: string | null;
  stoppedBy: string | null;
}

interface SimulationStatusProps {
  simulation: SimulationData;
}

export function SimulationStatus({ simulation }: SimulationStatusProps) {
  if (simulation.status === "stopped") {
    return (
      <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm shadow-xl border border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">
          Simulation Status
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Current Status */}
          <div className="rounded-lg bg-gray-700/30 p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium text-gray-300">Status</span>
            </div>
            <p className="text-lg font-semibold text-white capitalize">
              Stopped
            </p>
          </div>

          {/* Started By */}
          {simulation.startedBy && (
            <div className="rounded-lg bg-gray-700/30 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <svg
                  className="h-4 w-4 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-300">
                  Started By
                </span>
              </div>
              <p className="text-lg font-semibold text-white">
                {simulation.startedBy}
              </p>
            </div>
          )}

          {/* Start Time */}
          {simulation.startTime && (
            <div className="rounded-lg bg-gray-700/30 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <svg
                  className="h-4 w-4 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-300">
                  Start Time
                </span>
              </div>
              <p className="text-lg font-semibold text-white">
                {simulation.startTime}
              </p>
            </div>
          )}

          {/* Stop Time */}
          {simulation.stopTime && (
            <div className="rounded-lg bg-gray-700/30 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <svg
                  className="h-4 w-4 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-300">
                  Stop Time
                </span>
              </div>
              <p className="text-lg font-semibold text-white">
                {simulation.stopTime}
              </p>
            </div>
          )}

          {/* Stopped By */}
          {simulation.stoppedBy && (
            <div className="rounded-lg bg-gray-700/30 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <svg
                  className="h-4 w-4 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-300">
                  Stopped By
                </span>
              </div>
              <p className="text-lg font-semibold text-white">
                {simulation.stoppedBy}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gray-800/50 p-6 backdrop-blur-sm shadow-xl border border-gray-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">
        Simulation Status
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Current Status */}
        <div className="rounded-lg bg-gray-700/30 p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-300">Status</span>
          </div>
          <p className="text-lg font-semibold text-white capitalize">Running</p>
        </div>

        {/* Started By */}
        {simulation.startedBy && (
          <div className="rounded-lg bg-gray-700/30 p-4">
            <div className="flex items-center space-x-3 mb-2">
              <svg
                className="h-4 w-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-300">
                Started By
              </span>
            </div>
            <p className="text-lg font-semibold text-white">
              {simulation.startedBy}
            </p>
          </div>
        )}

        {/* Start Time */}
        {simulation.startTime && (
          <div className="rounded-lg bg-gray-700/30 p-4">
            <div className="flex items-center space-x-3 mb-2">
              <svg
                className="h-4 w-4 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-300">
                Start Time
              </span>
            </div>
            <p className="text-lg font-semibold text-white">
              {simulation.startTime}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
