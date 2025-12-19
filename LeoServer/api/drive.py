from pydantic import BaseModel
from fastapi import APIRouter
from yamcs.client import cmd_drive_distance

router = APIRouter()

class DriveBody(BaseModel):
    distance_m: float
    speed_mps: float

@router.post("/drive")
async def drive(body: DriveBody):
    return await cmd_drive_distance(body.distance_m, body.speed_mps)
