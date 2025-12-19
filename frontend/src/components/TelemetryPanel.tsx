"use client";

import { useTelemetry } from "../hooks/useTelemetry";

function formatUnixTime(ts?: number | null) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleTimeString();
}

export default function TelemetryPanel() {
  const telemetry = useTelemetry();

  if (!telemetry) {
    return (
      <div className="p-4 text-gray-400">
        Connecting telemetry…
      </div>
    );
  }

  async function downloadCsv() {
    if (!telemetry?.last_timed_csv_url || telemetry == null) return;

    try {
      const res = await fetch(telemetry.last_timed_csv_url);
      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      // a.download = "leorover_timed_run.csv"; // filename shown to user
      a.download = telemetry.last_timed_csv_object ?? "leorover_timed_run.csv";
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV download failed", err);
    }
  }

  return (
    <div className="p-3 space-y-4 text-sm">
      <h2 className="text-lg font-semibold">Telemetry</h2>

      <div className="space-y-1">
          <div>Battery: {telemetry.battery.toFixed(8)} V</div>
      </div>
        
      <hr className="border-gray-700" />
      
      <div className="space-y-1">
          <div>X: {telemetry.x.toFixed(8)} m</div>
          <div>Y: {telemetry.y.toFixed(8)} m</div>
          <div>Yaw: {telemetry.yaw.toFixed(8)} rad</div>
          <div>Total Distance: {telemetry.distance_total.toFixed(8)} m</div>
      </div>

      <hr className="border-gray-700" />

      <div className="space-y-1">
          <div>Linear speed: {telemetry.linear_speed.toFixed(2)} m/s</div>
          <div>Angular speed: {telemetry.angular_speed.toFixed(2)} rad/s</div>
      </div>

      <hr className="border-gray-700" />

      <div className="space-y-1">
        {/* <div>Last photo URL: {telemetry.last_photo_url}</div> */}
        <div className="flex flex-col">
            <span>Last photo URL:</span>
            <a
            href={telemetry.last_photo_url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 break-all whitespace-normal text-s"
            >
            {telemetry.last_photo_url}
            </a>
        </div>
        <div>Last photo time: {formatUnixTime(telemetry.last_photo_time_unix)}</div>
        <div>Last photo unix time: {telemetry.last_photo_time_unix}</div>
      </div>

      <hr className="border-gray-700" />

      <div className="space-y-1">
        <div className="flex flex-col">
          <span>Timed run CSV:</span>
          {telemetry.last_timed_csv_url && (
            <button
              onClick={downloadCsv}
              className="text-blue-400 underline text-left"
            >
              Download CSV
            </button>
          )}
        </div>
      </div>
      
    </div>
  );
}
