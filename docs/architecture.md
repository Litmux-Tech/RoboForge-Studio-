# Architecture

The whole platform hangs on **one data model and two moves**. Get these right and
every module composes; get them wrong and you have 15 disconnected tools.

## 1. The spine: `RobotProfile`

A single object that describes a robot — board, drive config, motor pins, sensors
(+ pins + mounts), and transports. Every module reads or writes it:

```
                         ┌──────────────────┐
   Circuit Builder ─────▶│                  │─────▶ Validator   (reads typed pins)
   (writes wiring)       │   RobotProfile   │─────▶ Simulator   (reads geometry)
                         │   = the netlist  │─────▶ Control/Dash (reads drivers)
                         │                  │─────▶ Codegen      (compiles firmware)
                         └──────────────────┘
```

Defined in [`packages/core/src/robotProfile.ts`](../packages/core/src/robotProfile.ts).
If it isn't expressible in a `RobotProfile`, it isn't part of a robot.

## 2. The simulator is just a Transport

A `Transport` is the only thing that differs between a simulated robot and a real
one. The control UI, dashboards, and behaviors all speak the same protocol
messages and never know which transport is underneath.

```
   Joystick / Autonomous behavior
            │   (same ProtocolMsg, always)
            ▼
        Transport
        ├── MockTransport ......... fake car, zero hardware (today)
        ├── SimTransport .......... Rapier rigid body + virtual sensors
        ├── WebSocketTransport .... real ESP32 over WiFi
        └── BleTransport .......... real ESP32 over Bluetooth LE
```

→ [ADR-0002](./adr/0002-sim-as-transport.md). Interface in
[`packages/core/src/transport/transport.ts`](../packages/core/src/transport/transport.ts).

## 3. Firmware is generated from the profile

```
RobotProfile ──┬─▶ Behaviors (written once, pure functions)
               │     run in-app against ANY transport (sim or real)
               │
               └─▶ Codegen ──▶ C++  (config.h now; main.cpp + transpiled
                                      behavior next) → roverlib runtime
```

V1 avoids the compiler entirely: a pre-built runtime is flashed once, and the
profile is pushed as live config. → [ADR-0003](./adr/0003-codegen-from-profile.md),
[ADR-0006](./adr/0006-firmware-build-strategy.md).

## Package layout

| Package | Role |
|---------|------|
| `packages/core` | the spine — RobotProfile, protocol, transports, safety, behaviors (platform-agnostic TS) |
| `packages/sim` | 3D simulation (R3F + Rapier); exports `SimTransport` — *stub* |
| `packages/codegen` | RobotProfile → PlatformIO C++ — *early* |
| `apps/web` | Vite + React control/design app |
| `apps/mobile` | React Native / Expo — *future*, reuses `core` ([ADR-0005](./adr/0005-react-native-not-flutter.md)) |
| `firmware/roverlib` | the C++ runtime that runs on the ESP32 — *skeleton* |

## Safety

A moving robot must stop when the app goes quiet or the link drops. Enforced
**twice**: `SafetyGuard` in the app (heartbeat + deadman) and an independent
timeout in the firmware. See
[`packages/core/src/safety.ts`](../packages/core/src/safety.ts).

## Local-first

V1 needs **no backend** — robot on the LAN, sim in the browser, flashing over Web
Serial. Server infra is deferred to cloud/marketplace/multiplayer features. →
[ADR-0004](./adr/0004-local-first-no-backend-v1.md).
