from fastapi import WebSocket
import asyncio
from core.state import telemetry_state

async def telemetry_endpoint(ws: WebSocket):
    await ws.accept()
    print("[TELEMETRY WS] Client connected")

    try:
        while True:
            await ws.send_json(telemetry_state)
            await asyncio.sleep(0.05)  # 20 Hz updates
    except Exception:
        print("[TELEMETRY WS] Client disconnected")
