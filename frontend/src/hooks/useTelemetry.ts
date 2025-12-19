"use client";

import { useEffect, useState } from "react";

export interface Telemetry {
  x: number;
  y: number;
  yaw: number;
  linear_speed: number;
  angular_speed: number;
  distance_total: number;
  battery: number;
  last_photo_url?: string | null;
  last_photo_time_unix?: number | null;
}

const WS_URL = "ws://10.0.0.186:8000/ws/telemetry";

export function useTelemetry() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTelemetry(data);
      } catch (err) {
        console.error("Telemetry parse error", err);
      }
    };

    ws.onerror = () => console.error("Telemetry WS error");
    ws.onclose = () => console.log("Telemetry WS closed");

    return () => ws.close();
  }, []);

  return telemetry;
}
