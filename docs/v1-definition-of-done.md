# V1 — Definition of Done

V1 is **one robot, fully looped**: the ESP32 4WD car, design to drive. It's done
when a user can do all of this without leaving the app.

## The robot

- ESP32 + L298N + 4 DC motors + HC-SR04 ultrasonic + servo mount + battery
- Profile: [`createEsp32FourWheelCar()`](../packages/core/src/robotProfile.ts)

## Must work

- [ ] **Pick / configure** the 4WD car (board, pins, sensors) in the app
- [ ] **Simulate** it in 3D — drive it around with a virtual joystick before building
- [ ] **Manual control** via keyboard + on-screen joystick, in sim and on the real robot, through the *same* UI
- [ ] **Live telemetry** — front distance, IMU heading, battery, uptime — streaming on a dashboard
- [ ] **Obstacle avoidance** — the same behavior runs in the sim and on the ESP32
- [ ] **WiFi control** of a real ESP32 over WebSocket (`WebSocketTransport`)
- [ ] **Generate firmware** for the configured car
- [ ] **Flash** the ESP32 from the browser (Web Serial), one click
- [ ] **Safety** — E-stop button + deadman timeout cut the motors on quiet/disconnect (verified on hardware)

## Explicitly NOT in V1

Circuit Builder UI · wiring validation · visual programming · multiple robot
types · mobile app · accounts/cloud · marketplace · per-project C++ compilation
(V1 uses the pre-built runtime + config push).

## Quality bar

- Typechecks clean (`pnpm typecheck`), web app builds (`pnpm build`)
- Mock transport works with zero hardware (dev never blocks on the bench)
- The sim↔real swap is **one line** in the store (the Transport), nothing else
