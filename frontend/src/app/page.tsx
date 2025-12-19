// src/app/page.tsx

import VideoPlayer from "../components/VideoPlayer";
import TelemetryPanel from "../components/TelemetryPanel";
import CommandsPanel from "../components/CommandsPanel";
import Joystick from "../components/Joystick";

export default function MissionConsole() {
  return (
    <main className="w-screen h-screen bg-[#0d1117] text-white overflow-hidden">

      {/* Top Bar */}
      <div className="w-full h-14 bg-[#161b22] flex items-center px-6 border-b border-gray-700">
        <h1 className="text-xl font-semibold">
          Avalon Space: LeoRover Mission Console
        </h1>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-20 grid-rows-1 w-full h-[calc(100%-3.5rem)]">

        {/* Telemetry */}
        <div className="col-span-4 bg-[#0d1117] border-r border-gray-700 p-4">
          <TelemetryPanel />
        </div>

        {/* Video Feed */}
        <div className="col-span-12 flex items-center justify-center bg-black relative">
          <VideoPlayer />

          {/* Fixed Joystick */}
          <div className="absolute bottom-4 right-4">
            <Joystick />
          </div>
        </div>

        {/* Commands */}
        <div className="col-span-4 bg-[#0d1117] border-l border-gray-700 p-4">
          <CommandsPanel />
        </div>

      </div>

    </main>
  );
}
