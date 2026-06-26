# ADR-0003 — Firmware is generated from the RobotProfile

**Status:** Accepted

## Context

The firmware must reflect the same robot the user designed and simulated. Hand-
writing it separately guarantees it drifts from the profile and the behaviors.

## Decision

Firmware is **derived from the `RobotProfile`** by `@roboforge/codegen`:

- Pins/sensors → `config.h` (today) and `main.cpp` (next).
- Autonomous **behaviors are pure functions in `@roboforge/core`** — the
  canonical source. Codegen **transpiles** them to C++ so the on-device logic is
  the exact same logic that ran in the simulator.

## Consequences

- No drift between simulated behavior and shipped firmware.
- Behaviors are constrained to a transpilable subset (simple, branch-clear) —
  which is also what keeps them readable and safe.
- The generated C++ stays thin because the drivers live in `roverlib`; codegen
  emits config + behavior, not the hardware layer.
