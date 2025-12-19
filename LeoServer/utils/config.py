class Settings:
    YAMCS_HOST = "10.0.0.186"
    # YAMCS_HOST = "localhost"

    YAMCS_PORT = 8090
    YAMCS_INSTANCE = "leorover"   
    
    VIDEO_TCP_PORT = 9000
    
    ROVER_MAX_LIN = 10.0
    ROVER_MAX_ANG = 10.0
    
    JOYSTICK_DEADZONE = 0.02
    JOYSTICK_MAX_HZ = 20       

settings = Settings()
