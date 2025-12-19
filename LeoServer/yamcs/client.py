# yamcs/client.py

import socket
import struct
import httpx
from utils.config import settings

# ------------------------------
# 1. DIRECT UDP CONTROL TO ROVER
# ------------------------------

ROVER_IP = "10.0.0.1"      # LeoRover address
ROVER_TC_PORT = 10051      # Your bridge's TC listen port

def _udp_send(packet: bytes):
    """Send raw UDP packet directly to the rover."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.sendto(packet, (ROVER_IP, ROVER_TC_PORT))
    sock.close()

async def send_manual_drive(linear_mps: float, angular_rps: float):
    """Joystick control → ID=6 → Rover"""
    packet = b"\x06" + struct.pack(">ff", linear_mps, angular_rps)
    _udp_send(packet)

async def send_stop():
    """Hard stop → ID=0 → Rover"""
    _udp_send(b"\x00")

# -----------------------------------------------------
# 2. YAMCS CONTROL (for UI commands, NOT for joystick)
# -----------------------------------------------------

async def send_yamcs_command(full_command_name: str, args: dict | None = None):
    """Send command through YAMCS (DriveDistance, TurnAngle, TakePhoto, TimedCapture...)"""

    url = (
        f"http://{settings.YAMCS_HOST}:{settings.YAMCS_PORT}"
        f"/api/commanding/instances/{settings.YAMCS_INSTANCE}/commands/{full_command_name}"
    )

    payload = {"arguments": args or {}}

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json()


# Wrappers for UI buttons
async def cmd_drive_distance(distance_m: float, speed_mps: float):
    return await send_yamcs_command("CMD/DriveDistance", {
        "distance_m": distance_m,
        "speed_mps": speed_mps,
    })

async def cmd_turn_angle(angle_deg: float, rate_degps: float):
    return await send_yamcs_command("CMD/TurnAngle", {
        "angle_deg": angle_deg,
        "rate_degps": rate_degps,
    })

async def cmd_take_photo():
    return await send_yamcs_command("CMD/TakePhoto", {})

async def cmd_start_timed(interval_sec: float, duration_sec: float):
    return await send_yamcs_command("CMD/StartTimedCapture", {
        "interval_sec": interval_sec,
        "duration_sec": duration_sec,
    })

async def cmd_stop_timed():
    return await send_yamcs_command("CMD/StopTimedCapture", {})
