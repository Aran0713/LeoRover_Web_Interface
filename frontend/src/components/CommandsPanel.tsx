"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/apis";
import { useTelemetry } from "../hooks/useTelemetry";

function clampInt(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export default function CommandPanel() {
  const telemetry = useTelemetry();

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [intervalSec, setIntervalSec] = useState<number>(2);
  const [durationSec, setDurationSec] = useState<number>(10);

  const [timedActive, setTimedActive] = useState(false);
  const [timedStartedAtMs, setTimedStartedAtMs] = useState<number | null>(null);
  const [timedPhotos, setTimedPhotos] = useState(0);

  const lastPhotoUnixRef = useRef<number | null>(null);

  const [driveDistanceM, setDriveDistanceM] = useState<number>(1);
  const [driveSpeedMps, setDriveSpeedMps] = useState<number>(2);

  const [turnAngleDeg, setTurnAngleDeg] = useState<number>(30);
  const [turnRateDegps, setTurnRateDegps] = useState<number>(30);

  const canStartTimed = intervalSec > 0 && durationSec > 0 && !timedActive && !busy;

  const remainingSec = useMemo(() => {
    if (!timedActive || timedStartedAtMs === null) return null;
    const elapsed = (Date.now() - timedStartedAtMs) / 1000;
    return Math.max(0, durationSec - elapsed);
  }, [timedActive, timedStartedAtMs, durationSec]);

  useEffect(() => {
    if (!telemetry) return;

    const ts = telemetry.last_photo_time_unix ?? null;

    if (lastPhotoUnixRef.current === null) {
      lastPhotoUnixRef.current = ts;
      return;
    }

    if (timedActive && ts && ts !== lastPhotoUnixRef.current) {
      setTimedPhotos((p) => p + 1);
    }

    lastPhotoUnixRef.current = ts;
  }, [telemetry, timedActive]);

  useEffect(() => {
    if (!timedActive) return;
    if (remainingSec === null) return;

    if (remainingSec <= 0) {
      setTimedActive(false);
      setTimedStartedAtMs(null);
    }
  }, [remainingSec, timedActive]);

  async function run(label: string, fn: () => Promise<unknown>) {
    setError(null);
    setBusy(label);
    try {
      await fn();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setBusy(null);
    }
  }

  const stopAll = async () => {
    await run("stop", async () => {
      await api.stop();
      if (timedActive) {
        try {
          await api.stopTimed();
        } catch {
          // ignore, Stop command is safety critical anyway
        }
      }
      setTimedActive(false);
      setTimedStartedAtMs(null);
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
      setTimedActive(true);
      setTimedStartedAtMs(Date.now());
      setTimedPhotos(0);
      lastPhotoUnixRef.current = telemetry?.last_photo_time_unix ?? null;
    });
  };

  const stopTimed = async () => {
    await run("stopTimed", async () => {
      await api.stopTimed();
      setTimedActive(false);
      setTimedStartedAtMs(null);
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Commands</h2>
        <div className="text-xs text-gray-400">
          {busy ? `Sending. ${busy}` : "Ready"}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3 space-y-3">
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={stopAll}
            disabled={!!busy}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold border border-red-700 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50"
          >
            STOP
          </button>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={takePhoto}
              disabled={!!busy}
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold border border-gray-700 bg-gray-900/40 hover:bg-gray-900/60 disabled:opacity-50"
            >
              Take Photo
            </button>

            {!timedActive ? (
              <div className="rounded-lg border border-gray-800 bg-black/30 p-3 space-y-3">
                <div className="text-sm font-semibold text-gray-200">
                  Timed Photos
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400">Interval. seconds</div>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={intervalSec}
                      onChange={(e) => setIntervalSec(Number(e.target.value))}
                      className="w-full rounded-md bg-gray-950 border border-gray-800 px-2 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-gray-400">Duration. seconds</div>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={durationSec}
                      onChange={(e) => setDurationSec(Number(e.target.value))}
                      className="w-full rounded-md bg-gray-950 border border-gray-800 px-2 py-2 text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={startTimed}
                  disabled={!canStartTimed}
                  className="w-full rounded-lg px-4 py-3 text-sm font-semibold border border-emerald-700 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-50"
                >
                  Start Timed Photos
                </button>

                {durationSec <= 0 ? (
                  <div className="text-xs text-gray-400">
                    Duration must be greater than 0.
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-800 bg-emerald-950/20 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-200">
                    Timed Photos Running
                  </div>
                  <div className="text-xs text-emerald-200">
                    Active
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md border border-gray-800 bg-black/30 p-2">
                    <div className="text-xs text-gray-400">Seconds left</div>
                    <div className="text-base font-semibold">
                      {remainingSec === null ? "-" : clampInt(remainingSec)}
                    </div>
                  </div>
                  <div className="rounded-md border border-gray-800 bg-black/30 p-2">
                    <div className="text-xs text-gray-400">Photos taken</div>
                    <div className="text-base font-semibold">{timedPhotos}</div>
                  </div>
                </div>

                <button
                  onClick={stopTimed}
                  disabled={!!busy}
                  className="w-full rounded-lg px-4 py-3 text-sm font-semibold border border-amber-700 bg-amber-600/20 hover:bg-amber-600/30 disabled:opacity-50"
                >
                  Stop Timed Photos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <details className="rounded-xl border border-gray-800 bg-gray-950/30 p-3">
        <summary className="cursor-pointer select-none text-sm font-semibold text-gray-200">
          Advanced Commands
        </summary>

        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-gray-800 bg-black/20 p-3 space-y-3">
            <div className="text-sm font-semibold text-gray-200">
              Drive Distance
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Distance. meters</div>
                <input
                  type="number"
                  step={0.1}
                  value={driveDistanceM}
                  onChange={(e) => setDriveDistanceM(Number(e.target.value))}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 px-2 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-gray-400">Speed. meters per second</div>
                <input
                  type="number"
                  step={0.1}
                  value={driveSpeedMps}
                  onChange={(e) => setDriveSpeedMps(Number(e.target.value))}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 px-2 py-2 text-sm"
                />
              </div>
            </div>

            <button
              onClick={drive}
              disabled={!!busy}
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold border border-gray-700 bg-gray-900/40 hover:bg-gray-900/60 disabled:opacity-50"
            >
              Execute Drive
            </button>
          </div>

          <div className="rounded-lg border border-gray-800 bg-black/20 p-3 space-y-3">
            <div className="text-sm font-semibold text-gray-200">
              Turn Angle
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Angle. degrees</div>
                <input
                  type="number"
                  step={1}
                  value={turnAngleDeg}
                  onChange={(e) => setTurnAngleDeg(Number(e.target.value))}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 px-2 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-gray-400">Rate. degrees per second</div>
                <input
                  type="number"
                  step={1}
                  value={turnRateDegps}
                  onChange={(e) => setTurnRateDegps(Number(e.target.value))}
                  className="w-full rounded-md bg-gray-950 border border-gray-800 px-2 py-2 text-sm"
                />
              </div>
            </div>

            <button
              onClick={turn}
              disabled={!!busy}
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold border border-gray-700 bg-gray-900/40 hover:bg-gray-900/60 disabled:opacity-50"
            >
              Execute Turn
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
