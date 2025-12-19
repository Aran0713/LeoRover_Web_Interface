"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/apis";

export type MissionStatus =
  | "unknown"
  | "connecting"
  | "connected"
  | "error";

export default function useMissionServer() {
  const [status, setStatus] = useState<MissionStatus>("unknown");

  async function checkConnection() {
    setStatus("connecting");
    const health = await getHealth();
    if (health && health.status === "ok") {
      setStatus("connected");
    } else {
      setStatus("error");
    }
  }

  useEffect(() => {
    let mounted = true;

    // Initial check
    (async () => {
      if (mounted) {
        await checkConnection();
      }
    })();

    // Re-check every 5 seconds
    const interval = setInterval(() => {
      if (mounted) {
        checkConnection();
      }
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { status };
}
