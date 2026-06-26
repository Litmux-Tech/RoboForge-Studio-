<div align="center">

# 🤖 RoboForge Studio

**The open-source platform to design, simulate, program, flash, and control robots — all in one place.**

`Design → Simulate → Validate → Generate Firmware → Flash → Control → Learn → Improve`

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](./LICENSE)
![Status](https://img.shields.io/badge/status-pre--alpha-orange)

</div>

---

## What is this?

Today, building a robot means juggling a circuit designer, a firmware IDE, a simulator, and a control app — four tools that don't talk to each other. **RoboForge Studio unifies the whole workflow into one application**: design the wiring, validate it, simulate the robot in 3D, generate the firmware, flash the microcontroller, and drive the real robot — without ever switching apps.

The long-term north star is *"the VS Code of Robotics."* See the full vision in [`docs/vision.md`](./docs/vision.md).

## The one idea that makes it work

Everything hangs on a single shared data model — the **`RobotProfile`** — and two architectural moves:

1. **The simulator is just another transport.** The same control UI and the same protocol messages drive either the Rapier 3D sim *or* a real ESP32 over WiFi. Flip one switch. "Same logic for sim and real" comes for free. → [ADR-0002](./docs/adr/0002-sim-as-transport.md)
2. **The firmware is generated from the profile.** Wiring + config + behavior compile down to C++ — or, in V1, get pushed as live config to a pre-built runtime so you never need a compiler. → [ADR-0003](./docs/adr/0003-codegen-from-profile.md), [ADR-0006](./docs/adr/0006-firmware-build-strategy.md)

Read [`docs/architecture.md`](./docs/architecture.md) for the spine.

## V1 scope (what we're building first)

A complete, real loop for **one** robot — the **ESP32 4WD car**:

- ESP32 + L298N motor driver + 4 DC motors + HC-SR04 ultrasonic + servo mount + battery
- WiFi (WebSocket) control with a virtual-joystick dashboard
- 3D simulation with obstacle-avoidance, drivable before you build it
- Firmware generation + one-click in-browser flash (Web Serial)
- Heartbeat/E-stop safety

Full checklist: [`docs/v1-definition-of-done.md`](./docs/v1-definition-of-done.md). Roadmap: [`docs/roadmap.md`](./docs/roadmap.md).

## Monorepo layout

```
packages/core      # THE SPINE — RobotProfile, protocol, transports, safety, behaviors (platform-agnostic TS)
packages/sim       # 3D simulation (React Three Fiber + Rapier) — a Transport implementation  [stub]
packages/codegen   # RobotProfile → PlatformIO C++ project                                    [stub]
apps/web           # Vite + React web app (control, dashboards, builders)
firmware/roverlib  # the C++ runtime that runs on the ESP32                                    [skeleton]
assets/models      # glb part library (chassis, wheels, ESP32, L298N, HC-SR04, ...)           [placeholder]
docs/              # architecture, ADRs, protocol spec, roadmap
```

## Quickstart

> Requires Node ≥ 18 and [pnpm](https://pnpm.io). The web shell drives a **mock car** out of the box — no hardware needed.

```bash
pnpm install
pnpm dev        # → http://localhost:5173
```

Connect to the built-in `MockTransport` and you'll see live telemetry stream in. Real ESP32 support (WebSocket transport) lands with the V1 walking skeleton.

## Tech stack

TypeScript · React + Vite · Tailwind · React Three Fiber + Rapier (sim) · React Flow (circuit builder) · Zustand · PlatformIO + Arduino/ESP-IDF (firmware). Local-first — **no backend required for V1** ([ADR-0004](./docs/adr/0004-local-first-no-backend-v1.md)).

## Contributing

Pre-alpha and moving fast. Architecture decisions live as ADRs in [`docs/adr/`](./docs/adr/) — read those first. Issues and discussion welcome.

## License

[MIT](./LICENSE) © RoboForge Studio contributors
