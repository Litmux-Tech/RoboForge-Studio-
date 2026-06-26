# Wire Protocol

Transport-agnostic message vocabulary. The same messages ride over WiFi, BLE, USB
serial, or the simulator. JSON today; a compact binary encoding can slot in
behind `encode()`/`decode()` later without touching callers.

Source of truth: [`packages/core/src/protocol.ts`](../packages/core/src/protocol.ts).

## App → Robot

| `t` | Fields | Meaning |
|-----|--------|---------|
| `drv` | `thr` (-1..1), `str` (-1..1) | continuous drive: throttle + steer |
| `cmd` | `a`: `estop`\|`stop`\|`horn`\|`light_on`\|`light_off`\|`measure` | discrete action |
| `cfg` | `sensors`: `SensorConfig[]` | push runtime sensor/pin config |
| `manifest?` | — | request the capability manifest |

## Robot → App

| `t` | Fields | Meaning |
|-----|--------|---------|
| `manifest` | `board`, `fw`, `drive`, `transports[]`, `drivers[]` | what am I, what do I have |
| `tel` | `ts` (uptime ms), `s` (sensorId → value), `batt?` (V) | telemetry frame (~10 Hz) |
| `log` | `level`, `msg` | status / debug line |

A telemetry value is a scalar (e.g. distance in cm) or a small object of scalars
(e.g. IMU `{yaw, pitch, roll}`).

## Examples

```jsonc
// drive forward-left
{ "t": "drv", "thr": 0.6, "str": -0.3 }

// emergency stop
{ "t": "cmd", "a": "estop" }

// capability manifest (on connect)
{ "t": "manifest", "board": "esp32", "fw": "roverlib-0.1.0",
  "drive": "diff4wd", "transports": ["wifi-ws","ble"],
  "drivers": ["hcsr04","mpu6050"] }

// telemetry
{ "t": "tel", "ts": 12450, "s": { "dist_front": 23.4, "imu": { "yaw": 0.10 } }, "batt": 7.82 }
```

## Conventions

- Distances in **cm**, angles in **radians** on the wire, battery in **volts**.
- `drv` is sent continuously (~20–50 Hz while driving); the firmware applies a
  **deadman timeout** (≈400 ms) and stops if commands stop arriving.
- Unknown `t` values are ignored, not errors — forward compatibility.
