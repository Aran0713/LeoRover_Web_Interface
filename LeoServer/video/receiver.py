import asyncio
import struct
from utils.config import settings
from core.state import latest_video_frame

# Receives JPEG frames from bridge.py
async def start_video_receiver():

    server = await asyncio.start_server(handle_client, "0.0.0.0", settings.VIDEO_TCP_PORT)
    print(f"[VIDEO] Receiver started on TCP port {settings.VIDEO_TCP_PORT}")

    async with server:
        await server.serve_forever()

async def handle_client(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    print("[VIDEO] bridge.py connected")

    try:
        while True:
            # Read 4-byte size header
            size_data = await reader.readexactly(4)
            size = struct.unpack(">I", size_data)[0]

            # Read JPEG frame
            frame = await reader.readexactly(size)

            # Store globally 
            latest_video_frame["data"] = frame

    except Exception as e:
        print("[VIDEO] Client disconnected", e)
