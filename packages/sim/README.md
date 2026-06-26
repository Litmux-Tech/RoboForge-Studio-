# @roboforge/sim

3D physics simulation — **React Three Fiber + Rapier**. Currently a stub.

The key export will be **`SimTransport`**, which implements the `Transport`
interface from `@roboforge/core`. That's what makes "same logic for sim and
real" true: the control UI sends the same protocol messages to `SimTransport`
(forces on a Rapier body) or to `WebSocketTransport` (a real ESP32) — it can't
tell the difference.

V1 modelling choices (deliberately simple):

- **Drive:** single rigid body, forward thrust ∝ throttle + yaw torque ∝ steer,
  with damping faking friction. No per-wheel raycast vehicle yet.
- **Ultrasonic:** `castRay` forward from the sensor mount, clamp to 4 m, add a
  small cone + noise.
- **IMU:** read body orientation / angular velocity directly.
- **Battery:** drain proportional to motor effort.

See [`docs/adr/0002-sim-as-transport.md`](../../docs/adr/0002-sim-as-transport.md).
