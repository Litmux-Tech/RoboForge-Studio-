# ADR-0006 — Firmware build & flash strategy

**Status:** Accepted

## Context

The ESP32 toolchain (`xtensa-esp32-elf-gcc` via PlatformIO/arduino-cli) is native
and **cannot run in a browser**. Yet we want one-click flashing and easy
reconfiguration without forcing every user to install a toolchain.

## Decision

**V1 — pre-built runtime + config over the wire:**

1. Hand-write one generic firmware, `roverlib` (driver registry, motor control,
   WiFi WebSocket server, JSON config parser).
2. Flash that pre-built binary **once**, in-browser via **Web Serial**
   (`esptool-js` / `esp-web-tools`).
3. Push the `RobotProfile` as a `cfg` message at runtime. Changing sensors, pins,
   or behavior = re-push config, **no recompile, no toolchain**.

**Phase 2 — real per-project compilation** (only when a user edits the generated
C++): a **Tauri** desktop shell that shells out to local PlatformIO, and/or a
**cloud build microservice** running the toolchain in a container.

## Consequences

- V1 needs no compiler and no backend — install-free, one-click flash.
- The pre-built runtime must bundle every V1 driver up front.
- Custom hand-edited firmware must wait for the Phase 2 compile path.
- Web Serial is Chromium-only (Chrome/Edge); Firefox/Safari users use the desktop
  shell later. Documented limitation.
