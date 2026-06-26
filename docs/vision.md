# RoboForge Studio — Vision

> The open-source platform to **design, simulate, program, flash, and control robots** — all in one place.

## The problem

Building a robot today means juggling separate, disconnected tools: a circuit
designer, a firmware IDE, a 3D simulator, and a control app. None of them share a
model of *your robot*, so you re-enter the same facts four times and nothing
flows end to end.

## Core philosophy

```
Design → Simulate → Validate → Generate Firmware → Flash → Control → Learn → Improve
```

Every robot moves through one workflow, in one app, on top of **one shared data
model** (the `RobotProfile`).

## North star

*"The VS Code of Robotics"* — one open-source platform where anyone can learn
electronics, design circuits, simulate robots, generate firmware, flash
microcontrollers, control real robots, develop autonomous behaviors, and
collaborate with a community.

## Modules (long-term)

Robot Studio · Circuit Builder + Smart Wiring · 3D Simulator · Autonomous Lab ·
Firmware Generator · Firmware Flashing · Robot Dashboard · Communication Manager ·
Sensor Manager · Pin Manager · Voice Assistant · Vision System · Visual
Programming · Real-time Terminal · Cloud Workspace · Marketplace · Plugin SDK ·
Learning Academy · Competition Mode.

> These are the **north star**, not a backlog we owe. Many are multi-month or
> research-grade (SLAM, in-browser YOLO, multiplayer arena) and live in Phase 3–4.

## Target hardware

**ESP32 is the primary target** (WiFi + BT Classic + BLE all onboard — the only
board that makes every comm option real). ESP8266, Arduino, STM32, and Pi Pico
follow as profiles with documented limits.

## How we build it

**Spec the spine deeply, sketch the leaves.** Living docs + ADRs in the repo, not
a big upfront SRS. Validate integration with a **walking skeleton** early (drive
a robot end-to-end through the thinnest possible slice), then grow module by
module. See [`architecture.md`](./architecture.md) and [`adr/`](./adr/).
