"use client";

import { useRef, useEffect } from "react";
import { Joystick } from "react-joystick-component";


export default function DriveJoystick() {
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket("ws://10.0.0.186:8000/ws/joystick");
        wsRef.current = ws;

        ws.onopen = () => console.log("Joystick WS connected");
        ws.onerror = () => console.log("Joystick WS error");
        ws.onclose = () => console.log("Joystick WS disconnected");

        return () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ linear: 0, angular: 0 }));
            }
        };
    }, []);

    const send = (linear: number, angular: number) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        ws.send(JSON.stringify({ linear, angular }));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMove = (event: any) => {
        // const x = event.x;
        // const y = event.y;
        // const dead = 0.0;
        // const fx = Math.abs(x) < dead ? 0 : x;
        // const fy = Math.abs(y) < dead ? 0 : y;
        // const MAX_LINEAR = 10.0;   
        // const MAX_ANGULAR = 10.0; 
        const fx = event.x;
        const fy = event.y;

        const linear = fy;
        const angular = -fx;

        send(linear, angular);
    };

    const handleStop = () => {
        send(0, 0);
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            <Joystick
                size={120}
                baseColor="#1f2937"
                stickColor="#4b5563"
                throttle={50}
                move={handleMove}
                stop={handleStop}
            />
        </div>
    );
}
