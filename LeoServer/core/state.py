import time

# Latest Jpeg
latest_video_frame = {"data": None}

# Last telemetry 
telemetry_state = {
    "x": 0.0,
    "y": 0.0,
    "yaw": 0.0,
    "linear_speed": 0.0,
    "angular_speed": 0.0,
    "distance_total": 0.0,
    "battery": 0.0,
    "last_photo_url": None,
    "last_photo_time_unix": None,
}

# Joystick control state
joystick_state = {
    "last_linear": 0.0,
    "last_angular": 0.0,
    "last_sent_time": 0.0, # unix timestamp 
}
