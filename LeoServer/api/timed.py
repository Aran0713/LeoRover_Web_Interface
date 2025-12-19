from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException
from yamcs.client import cmd_start_timed, cmd_stop_timed

router = APIRouter()

class TimedStartBody(BaseModel):
    interval_sec: float = Field(..., gt=0.0)
    duration_sec: float = Field(..., gt=0.0)

@router.post("/timed/start")
async def start_timed(body: TimedStartBody):
    # duration_sec must be > 0, enforced by Field gt
    return await cmd_start_timed(body.interval_sec, body.duration_sec)

@router.post("/timed/stop")
async def stop_timed():
    return await cmd_stop_timed()
