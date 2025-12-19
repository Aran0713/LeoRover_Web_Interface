# yamcs/telemetry.py

import aiohttp
import json
from utils.config import settings
from core.state import telemetry_state

# Parameters we care about (FULL PATHS)
PARAM_NAMES = [
    "/leorover/ODOM/x",
    "/leorover/ODOM/y",
    "/leorover/ODOM/yaw",
    "/leorover/ODOM/linear_speed",
    "/leorover/ODOM/angular_speed",
    "/leorover/ODOM/distance_total",
    "/leorover/ODOM/battery",
    "/leorover/ODOM/last_photo_url",
    "/leorover/ODOM/last_photo_time_unix",
    "/leorover/ODOM/last_timed_csv_bucket",
    "/leorover/ODOM/last_timed_csv_object",
    "/leorover/ODOM/last_timed_csv_url",
    
]


async def yamcs_telemetry_listener():
    ws_url = f"ws://{settings.YAMCS_HOST}:{settings.YAMCS_PORT}/api/websocket"
    print("[TELEMETRY] Connecting WebSocket:", ws_url)

    # numericId → parameter name mapping
    numeric_id_map: dict[int, str] = {}

    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(ws_url) as ws:
            print("[TELEMETRY] WebSocket connected")

            # 🔹 IMPORTANT: explicit parameter subscription
            subscribe_msg = {
                "type": "parameters",
                "id": 1,
                "options": {
                    "instance": settings.YAMCS_INSTANCE,
                    "processor": "realtime",
                    "action": "REPLACE",
                    "sendFromCache": True,
                    "id": [{"name": p} for p in PARAM_NAMES],
                },
            }

            print("[TELEMETRY] Sending subscription:", subscribe_msg)
            await ws.send_json(subscribe_msg)
            print("[TELEMETRY] Subscription sent")

            async for msg in ws:
                if msg.type != aiohttp.WSMsgType.TEXT:
                    continue

                try:
                    payload = json.loads(msg.data)

                    # Uncomment for deep debugging
                    # print("[TELEMETRY] RAW:", payload)

                    if payload.get("type") != "parameters":
                        continue

                    data = payload.get("data", {})

                    # --------------------------------------------------
                    # 1️⃣ Handle mapping packet (numericId → name)
                    # --------------------------------------------------
                    if "mapping" in data:
                        for numeric_id, info in data["mapping"].items():
                            numeric_id_map[int(numeric_id)] = info["name"]

                        print("[TELEMETRY] Mapping received:", numeric_id_map)
                        continue

                    # --------------------------------------------------
                    # 2️⃣ Handle values packet
                    # --------------------------------------------------
                    values = data.get("values", [])
                    if not values:
                        continue

                    for pv in values:
                        numeric_id = pv.get("numericId")
                        if numeric_id is None:
                            continue

                        name = numeric_id_map.get(numeric_id)
                        if name is None:
                            continue

                        eng = pv.get("engValue", {})

                        # Extract value safely
                        if "doubleValue" in eng:
                            val = float(eng["doubleValue"])
                        elif "floatValue" in eng:
                            val = float(eng["floatValue"])
                        elif "stringValue" in eng:
                            val = eng["stringValue"]
                        else:
                            continue

                        # Update telemetry_state
                        if name.endswith("/x"):
                            telemetry_state["x"] = val
                        elif name.endswith("/y"):
                            telemetry_state["y"] = val
                        elif name.endswith("/yaw"):
                            telemetry_state["yaw"] = val
                        elif name.endswith("/linear_speed"):
                            telemetry_state["linear_speed"] = val
                        elif name.endswith("/angular_speed"):
                            telemetry_state["angular_speed"] = val
                        elif name.endswith("/distance_total"):
                            telemetry_state["distance_total"] = val
                        elif name.endswith("/battery"):
                            telemetry_state["battery"] = val
                        elif name.endswith("/last_photo_url"):
                            telemetry_state["last_photo_url"] = val
                        elif name.endswith("/last_photo_time_unix"):
                            telemetry_state["last_photo_time_unix"] = val
                        elif name.endswith("/last_timed_csv_bucket"):
                            telemetry_state["last_timed_csv_bucket"] = val
                        elif name.endswith("/last_timed_csv_object"):
                            telemetry_state["last_timed_csv_object"] = val
                        elif name.endswith("/last_timed_csv_url"):
                            telemetry_state["last_timed_csv_url"] = val

                except Exception as e:
                    print("[TELEMETRY] Error parsing message:", e)

