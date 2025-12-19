import time
from utils.config import settings


def apply_deadzone(value: float, deadzone: float) -> float:
    if abs(value) < deadzone:
        return 0.0
    return value


def clamp_velocity(linear: float, angular: float) -> tuple[float, float]:
    lin = max(-settings.ROVER_MAX_LIN, min(settings.ROVER_MAX_LIN, linear))
    ang = max(-settings.ROVER_MAX_ANG, min(settings.ROVER_MAX_ANG, angular))
    return lin, ang


def should_send_command(last_sent_time: float) -> bool:
    if last_sent_time == 0.0:
        return True

    now = time.time()
    min_interval = 1.0 / settings.JOYSTICK_MAX_HZ

    return (now - last_sent_time) >= min_interval
