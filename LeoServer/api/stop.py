from fastapi import APIRouter
from yamcs.client import send_stop

router = APIRouter()

@router.post("/stop")
async def stop():
    return await send_stop()
