"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/apis";

/* ---------- helpers ---------- */

function clampNonNeg(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

function formatTime(sec: number) {
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ---------- types ---------- */

type TimedStatus = "idle" | "running";

type LastTimedRun = {
  photos: number;
  duration: number | "infinite";
};

/* ---------- component ---------- */

export default function CommandPanel() {
  /* ----- global UI state ----- */

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ----- timed capture inputs ----- */

  const [intervalSec, setIntervalSec] = useState(2);
  const [durationSec, setDurationSec] = useState(10); // 0 = infinite

  /* ----- timed capture runtime state ----- */

  const [timedStatus, setTimedStatus] = useState<TimedStatus>("idle");
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  // This is now only used to display last run while idle
  const [photosTaken, setPhotosTaken] = useState(0);
  const [lastRun, setLastRun] = useState<LastTimedRun | null>(null);

  /* ----- Drive commands ----- */

  const [driveDistanceM, setDriveDistanceM] = useState(1);
  const [driveSpeedMps, setDriveSpeedMps] = useState(10);
  const [turnAngleDeg, setTurnAngleDeg] = useState(30);
  const [turnRateDegps, setTurnRateDegps] = useState(30);

  /* ---------- derived ---------- */

  const infiniteMode = durationSec === 0;
  const canStartTimed = timedStatus === "idle" && !busy && intervalSec > 0 && durationSec >= 0;

  // Compute live photo count from elapsed time.
  // Backend takes a photo at t = 0, then every intervalSec while t is strictly less than duration.
  const livePhotos = useMemo(() => {
    if (timedStatus !== "running") return photosTaken;

    const safeInterval = Math.max(0.1, intervalSec);
    const epsilon = 1e-6;

    const effectiveElapsed = infiniteMode
      ? Math.max(0, elapsedSec)
      : Math.min(Math.max(0, durationSec - epsilon), Math.max(0, elapsedSec));

    return 1 + Math.floor(effectiveElapsed / safeInterval);
  }, [timedStatus, photosTaken, intervalSec, elapsedSec, infiniteMode, durationSec]);

  /* ---------- helpers ---------- */

  async function run(label: string, fn: () => Promise<void>) {
    setError(null);
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  const finishTimedRun = useCallback(() => {
    setTimedStatus("idle");
    setStartedAtMs(null);

    setPhotosTaken(livePhotos);

    setLastRun({
      photos: livePhotos,
      duration: infiniteMode ? "infinite" : durationSec,
    });
  }, [livePhotos, infiniteMode, durationSec]);

  /* ---------- Use Effects ---------- */

  // Track elapsed time while running
  useEffect(() => {
    if (timedStatus !== "running" || startedAtMs === null) return;

    const id = setInterval(() => {
      setElapsedSec((Date.now() - startedAtMs) / 1000);
    }, 200);

    return () => clearInterval(id);
  }, [timedStatus, startedAtMs]);

  // Auto finish when duration expires (non infinite only)
  useEffect(() => {
    if (timedStatus !== "running") return;
    if (infiniteMode) return;
    if (elapsedSec < durationSec) return;

    finishTimedRun();
  }, [elapsedSec, timedStatus, durationSec, infiniteMode, finishTimedRun]);

  /* ---------- Functions ---------- */

  const stopAll = async () => {
    await run("stop", async () => {
      await api.stop();
      if (timedStatus === "running") {
        try {
          await api.stopTimed();
        } catch {}
        finishTimedRun();
      }
    });
  };

  const takePhoto = async () => {
    await run("takePhoto", async () => {
      await api.takePhoto();
    });
  };

  const startTimed = async () => {
    await run("startTimed", async () => {
      await api.startTimed(intervalSec, durationSec);

      setTimedStatus("running");
      setStartedAtMs(Date.now());
      setElapsedSec(0);

      // Reset stored last run count.
      // Live count while running is computed from elapsed time.
      setPhotosTaken(0);
    });
  };

  const stopTimed = async () => {
    await run("stopTimed", async () => {
      await api.stopTimed();
      finishTimedRun();
    });
  };

  const drive = async () => {
    await run("drive", async () => {
      await api.drive(driveDistanceM, driveSpeedMps);
    });
  };

  const turn = async () => {
    await run("turn", async () => {
      await api.turn(turnAngleDeg, turnRateDegps);
    });
  };

  /* ---------- render ---------- */

  return (
    <div className="p-3 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Commands</h2>
      </div>

      {error && (
        <div className="rounded-md border border-red-700 bg-red-950/40 p-2 text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-2 space-y-2">
        <button
          onClick={stopAll}
          disabled={!!busy}
          className="w-full rounded-md py-2 font-semibold border border-red-700 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50"
        >
          STOP
        </button>

        <button
          onClick={takePhoto}
          disabled={!!busy}
          className="w-full rounded-md py-2 font-semibold border border-gray-700 bg-gray-900/40 hover:bg-gray-900/60 disabled:opacity-50"
        >
          Take Photo
        </button>

        <div className="rounded-md border border-gray-800 bg-black/30 p-2 space-y-2">
          <div className="font-semibold">Timed Photos</div>

          {timedStatus === "idle" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-400">Interval (s)</div>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(clampNonNeg(Number(e.target.value)))}
                    className="w-full rounded-md bg-gray-950 border border-gray-800 px-2 py-1"
                  />
                </div>

                <div>
                  <div className="text-xs text-gray-400">Duration (s)</div>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={durationSec}
                    onChange={(e) => setDurationSec(clampNonNeg(Number(e.target.value)))}
                    className="w-full rounded-md bg-gray-950 border border-gray-800 px-2 py-1"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-400">Enter 0 for infinite capture</div>

              <button
                onClick={startTimed}
                disabled={!canStartTimed}
                className="w-full rounded-md py-2 font-semibold border border-emerald-700 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-50"
              >
                Start Timed Photos
              </button>

              {lastRun && (
                <div className="text-xs text-gray-300 border-t border-gray-800 pt-2">
                  Last run: {lastRun.photos} photos ·{" "}
                  {lastRun.duration === "infinite" ? "∞ infinite" : `${lastRun.duration}s`}
                </div>
              )}
            </>
          )}

          {timedStatus === "running" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-gray-800 bg-black/40 p-2">
                  <div className="text-xs text-gray-400">Elapsed</div>
                  <div className="font-semibold">{formatTime(elapsedSec)}</div>
                </div>

                <div className="rounded-md border border-gray-800 bg-black/40 p-2">
                  <div className="text-xs text-gray-400">Photos</div>
                  <div className="font-semibold">{livePhotos}</div>
                </div>
              </div>

              {infiniteMode && <div className="text-xs text-blue-300">∞ Infinite capture mode</div>}

              <button
                onClick={stopTimed}
                disabled={!!busy}
                className="w-full rounded-md py-2 font-semibold border border-amber-700 bg-amber-600/20 hover:bg-amber-600/30 disabled:opacity-50"
              >
                Stop Timed Photos
              </button>
            </>
          )}
        </div>
      </div>

      <details className="rounded-lg border border-gray-800 bg-gray-950/30 p-2">
        <summary className="cursor-pointer font-semibold">Drive Commands</summary>

        <div className="mt-2 space-y-2">
          <div className="rounded-md border border-gray-800 bg-black/20 p-2 space-y-2">
            <div className="font-semibold">Drive Distance</div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-400">Distance (m)</div>
                <input
                  type="number"
                  step={0.1}
                  value={driveDistanceM}
                  onChange={(e) => setDriveDistanceM(Number(e.target.value))}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 px-2 py-1"
                />
              </div>

              <div>
                <div className="text-xs text-gray-400">Speed (m/s)</div>
                <input
                  type="number"
                  step={0.1}
                  value={driveSpeedMps}
                  onChange={(e) => setDriveSpeedMps(Number(e.target.value))}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 px-2 py-1"
                />
              </div>
            </div>

            <button
              onClick={drive}
              disabled={!!busy}
              className="w-full rounded-md py-2 border border-gray-700 bg-gray-900/40 hover:bg-gray-900/60 disabled:opacity-50"
            >
              Execute Drive
            </button>
          </div>

          <div className="rounded-md border border-gray-800 bg-black/20 p-2 space-y-2">
            <div className="font-semibold">Turn Angle</div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-400">Angle (deg)</div>
                <input
                  type="number"
                  step={1}
                  value={turnAngleDeg}
                  onChange={(e) => setTurnAngleDeg(Number(e.target.value))}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 px-2 py-1"
                />
              </div>

              <div>
                <div className="text-xs text-gray-400">Rate (deg/s)</div>
                <input
                  type="number"
                  step={1}
                  value={turnRateDegps}
                  onChange={(e) => setTurnRateDegps(Number(e.target.value))}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 px-2 py-1"
                />
              </div>
            </div>

            <button
              onClick={turn}
              disabled={!!busy}
              className="w-full rounded-md py-2 border border-gray-700 bg-gray-900/40 hover:bg-gray-900/60 disabled:opacity-50"
            >
              Execute Turn
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
