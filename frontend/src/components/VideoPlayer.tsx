// src/components/VideoPlayer.tsx

"use client";
import { useState } from "react";

export default function VideoPlayer() {
    const STREAM_URL =
        "http://10.0.0.1:8080/stream?topic=/camera/image_color&type=ros_compressed";

    const [error, setError] = useState(false);

    return (
        <div className="w-full h-full flex items-center justify-center bg-black relative overflow-hidden">
            {!error ? (
                <img
                    src={STREAM_URL}
                    onError={() => setError(true)}
                    alt="Rover Camera Feed"
                    className="object-contain w-full h-full"
                    draggable={false}
                />
            ) : (
                <div className="text-gray-400 text-lg">
                    Camera Offline
                </div>
            )}
        </div>
    );
}
