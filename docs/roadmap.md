# Roadmap

Each phase is a usable product on its own. We don't start a phase until the
previous one's walking skeleton works end to end.

## Phase 1 — The controller (V1)  ← we are here

One complete loop for the **ESP32 4WD car**: design (config) → simulate → control
→ generate firmware → flash → drive.

- [x] Monorepo + spine (`RobotProfile`, protocol, transports, safety)
- [x] Web shell driving a mock car
- [ ] `SimTransport` — drive the car in the Rapier 3D sim
- [ ] `WebSocketTransport` — drive a real ESP32 over WiFi
- [ ] `roverlib` motor + HC-SR04 + IMU drivers (un-stub)
- [ ] Obstacle-avoidance running in sim **and** on the robot
- [ ] Firmware generation + one-click in-browser flash (Web Serial)

Full checklist: [`v1-definition-of-done.md`](./v1-definition-of-done.md).

## Phase 2 — Design & generate

- Circuit Builder (React Flow node-graph) + Smart Wiring validation
- Visual programming (blocks) for behaviors
- Real per-project firmware compilation (Tauri + local PlatformIO, or cloud build)
- AI firmware assistant · ESP32-CAM
- More robot types (2WD, tank, line follower)

## Phase 3 — Autonomy & scale

- Autonomous Lab: wall following, line following, path planning, follow-me
- Richer sim (per-wheel physics, more environments)
- Multi-robot sim · React Native mobile app
- Cloud workspace + project sync (first backend appears here)

## Phase 4 — Ecosystem

- Plugin marketplace + Plugin SDK
- Learning Academy curriculum · Competition mode
- Team collaboration · advanced vision (object detection, SLAM)

> Phase 3–4 items are the north star. Some may never be built, and that's fine.
