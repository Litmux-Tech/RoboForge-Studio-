# @roboforge/codegen

Generates firmware from a `RobotProfile`. Early stage.

Today it emits `config.h` (the pin map + sensor table). The roadmap:

1. **`config.h`** — pin map from the profile ✅ (`generateConfigHeader`)
2. **`main.cpp`** — wire the pins to `roverlib` drivers + the WS server
3. **behavior transpile** — the same `obstacleAvoidanceStep` from
   `@roboforge/core`, emitted as C++ for on-device autonomy
4. **full PlatformIO project** — ready to compile/flash

For V1 we mostly *don't compile per project*: the generated `config.h` is pushed
to the pre-built runtime as a `cfg` message at runtime. Compilation only matters
once a user customises the generated C++. See
[`docs/adr/0006-firmware-build-strategy.md`](../../docs/adr/0006-firmware-build-strategy.md).
