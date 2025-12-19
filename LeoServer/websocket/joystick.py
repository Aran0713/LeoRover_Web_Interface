import time
import asyncio
from fastapi import WebSocket
from yamcs.client import send_manual_drive, send_stop
from core.state import joystick_state
from core.safety import apply_deadzone, clamp_velocity
from utils.config import settings

TARGET_PERIOD = 0.02  # 50 Hz


async def joystick_endpoint(ws: WebSocket):
    await ws.accept()
    print("[JOYSTICK] Client connected")

    joystick_state["linear"] = 0.0
    joystick_state["angular"] = 0.0
    joystick_state["connected"] = True

    receiver = asyncio.create_task(_recv_joystick(ws))
    sender = asyncio.create_task(_send_loop())

    try:
        await asyncio.gather(receiver, sender)
    except Exception as e:
        print("[JOYSTICK] Error:", e)
    finally:
        joystick_state["connected"] = False
        await send_stop()
        print("[JOYSTICK] Connection fully closed")


async def _recv_joystick(ws: WebSocket):
    try:
        while True:
            data = await ws.receive_json()

            raw_lin = float(data.get("linear", 0.0))
            raw_ang = float(data.get("angular", 0.0))

            lin = apply_deadzone(raw_lin, settings.JOYSTICK_DEADZONE)
            ang = apply_deadzone(raw_ang, settings.JOYSTICK_DEADZONE)

            lin, ang = clamp_velocity(lin, ang)

            joystick_state["linear"] = lin
            joystick_state["angular"] = ang
    except:
        pass


async def _send_loop():
    while joystick_state.get("connected", False):
        lin = joystick_state.get("linear", 0.0)
        ang = joystick_state.get("angular", 0.0)

        await send_manual_drive(lin, ang)
        await asyncio.sleep(TARGET_PERIOD)
