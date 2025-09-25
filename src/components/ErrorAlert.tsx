"use client";

interface ErrorAlertProps {
  error: string | null;
}

export function ErrorAlert({ error }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-4 backdrop-blur-sm">
      <p className="text-sm text-red-300">{error}</p>
    </div>
  );
}
