from pydantic import BaseModel
from fastapi import APIRouter
from yamcs.client import cmd_turn_angle

router = APIRouter()

class TurnBody(BaseModel):
    angle_deg: float
    rate_degps: float = 30.0

@router.post("/turn")
async def turn(body: TurnBody):
    return await cmd_turn_angle(body.angle_deg, body.rate_degps)
