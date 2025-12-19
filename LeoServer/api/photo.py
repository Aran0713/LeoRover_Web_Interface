from fastapi import APIRouter
from yamcs.client import cmd_take_photo

router = APIRouter()

@router.post("/photo")
async def take_photo():
    return await cmd_take_photo()
