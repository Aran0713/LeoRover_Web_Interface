from fastapi import WebSocket
from core.state import latest_video_frame
import asyncio

async def video_endpoint(ws: WebSocket):
    
    await ws.accept()
    try:
        while True:
            frame = latest_video_frame.get("data")
            if frame:
                await ws.send_bytes(frame)

            await asyncio.sleep(0.03)  # ~33 fps
    except:
        pass
