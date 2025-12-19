import { MISSION_SERVER_HTTP } from "./constants";
import { ENDPOINTS, MISSION_SERVER } from "../../config";

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${MISSION_SERVER}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed. ${res.status}. ${text}`);
  }

  return (await res.json()) as T;
}

export const api = {
  stop: () => postJson(ENDPOINTS.stop),
  takePhoto: () => postJson(ENDPOINTS.takePhoto),
  startTimed: (interval_sec: number, duration_sec: number) =>
    postJson(ENDPOINTS.startTimed, { interval_sec, duration_sec }),
  stopTimed: () => postJson(ENDPOINTS.stopTimed),

  drive: (distance_m: number, speed_mps: number) =>
    postJson(ENDPOINTS.drive, { distance_m, speed_mps }),
  turn: (angle_deg: number, rate_degps: number) =>
    postJson(ENDPOINTS.turn, { angle_deg, rate_degps }),
};


export async function getHealth() {
  try {
    const res = await fetch(`${MISSION_SERVER_HTTP}/health`);
    if (!res.ok) throw new Error("Server returned an error");
    return await res.json();
  } catch (err) {
    console.error("Health check failed", err);
    return null;
  }
}

export async function getConfig() {
  try {
    const res = await fetch(`${MISSION_SERVER_HTTP}/config`);
    if (!res.ok) throw new Error("Server returned an error");
    return await res.json();
  } catch (err) {
    console.error("Config fetch failed", err);
    return null;
  }
}
