# roverlib — RoboForge ESP32 runtime firmware

The **pre-built firmware** the app flashes onto the ESP32 **once**. After that,
the robot is configured by *data*, not by recompiling: the app pushes pins +
sensor config as a `cfg` message over the WebSocket link, and `roverlib`
instantiates the matching drivers.

Why this design: it lets V1 ship with **no compiler toolchain** — change
sensors, pins, or behavior and just re-push config. Real per-project
compilation only matters once a user edits the generated C++. See
[`docs/adr/0006-firmware-build-strategy.md`](../../docs/adr/0006-firmware-build-strategy.md).

## Build (PlatformIO)

```bash
pio run                     # compile
pio run -t upload           # flash over USB
pio device monitor          # serial @ 115200
```

Default brings up a WiFi AP `RoboForge-Car` (pass `roboforge`) with a WebSocket
server on `:81` at `192.168.4.1`.

## Status

Drivers implemented (`roverlib-0.2.0`): L298N motor control via LEDC PWM
(differential drive), HC-SR04 ultrasonic, MPU6050 yaw (raw I2C gyro integration),
and an on-device deadman. Pins are hardcoded to the 4WD profile for now (codegen
will emit `config.h` later). Untested on physical hardware — flash and try.
