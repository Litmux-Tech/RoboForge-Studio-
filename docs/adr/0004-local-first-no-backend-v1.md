# ADR-0004 — Local-first, no backend in V1

**Status:** Accepted

## Context

The vision lists NestJS + PostgreSQL + Redis + MQTT. But V1 — drive a robot on
the LAN, simulate in the browser, flash over Web Serial — crosses the network
only to the robot itself. A server would be premature infrastructure.

## Decision

**V1 ships with no backend.** Robot control is a direct LAN WebSocket to the
ESP32; the simulator and flashing run entirely in the browser. Projects are
stored locally (browser storage / file export).

A backend is introduced only when a feature actually needs one — cloud workspace,
accounts, marketplace, multiplayer — in **Phase 3–4**.

## Consequences

- Dramatically faster path to a working MVP; works offline.
- No auth/hosting/ops burden during the phase that proves the concept.
- Cloud sync, sharing, and multiplayer are deferred (acceptable for V1).
