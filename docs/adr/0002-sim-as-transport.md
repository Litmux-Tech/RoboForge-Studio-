# ADR-0002 — The simulator is a Transport

**Status:** Accepted

## Context

A headline goal is *"same logic for simulation and real robot."* Naively that
means keeping two code paths in sync forever — they always diverge.

## Decision

The simulator implements the same **`Transport`** interface as the real-robot
links. The control UI, dashboards, and behaviors only ever send/receive
`ProtocolMsg`; they never know which transport is underneath:

- `MockTransport` — a fake car (zero hardware)
- `SimTransport` — applies `drv` to a Rapier rigid body, derives telemetry from
  virtual sensors (ray-cast ultrasonic, IMU from body orientation)
- `WebSocketTransport` / `BleTransport` — a real ESP32

Switching from sim to real is **one line** (which `Transport` the store
constructs). The UI does not move.

## Consequences

- "Same logic" is true *by construction*, not by discipline.
- Behaviors and dashboards are written once and work against both.
- The sim will never exactly predict reality (the **sim-to-real gap**: motor lag,
  wheel slip, friction). It's for developing logic, not exact prediction —
  acceptable and expected.
