from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio

from api.drive import router as drive_router
from api.turn import router as turn_router
from api.stop import router as stop_router
from api.photo import router as photo_router
from api.timed import router as timed_router

from websocket.joystick import joystick_endpoint
from websocket.telemetry import telemetry_endpoint


from yamcs.telemetry import yamcs_telemetry_listener


app = FastAPI()

# Frontend CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# API ROUTERS
app.include_router(drive_router, prefix="/api")
app.include_router(turn_router, prefix="/api")
app.include_router(stop_router, prefix="/api")
app.include_router(photo_router, prefix="/api")
app.include_router(timed_router, prefix="/api")

# WEBSOCKET ENDPOINTS
@app.websocket("/ws/joystick")
async def ws_joystick(ws: WebSocket):
    await joystick_endpoint(ws)

@app.websocket("/ws/telemetry")
async def ws_telemetry(ws: WebSocket):
    await telemetry_endpoint(ws)

# BACKGROUND TASKS
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(yamcs_telemetry_listener())

@app.get("/health")
def health():
    return {"status": "ok"}
