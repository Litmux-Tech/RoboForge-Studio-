/**
 * @roboforge/sim — the 3D physics simulation (React Three Fiber + Rapier).
 *
 * STUB. The headline export will be `SimTransport`: a Transport (see
 * @roboforge/core) that applies drive commands to a Rapier rigid body and
 * streams telemetry from virtual sensors. Because it implements the SAME
 * Transport interface as the real-robot transports, the entire control UI
 * drives the simulator unchanged — that is the whole point.
 *
 * Planned surface:
 *   <SimScene profile={RobotProfile} />   R3F scene built from profile geometry
 *   class SimTransport implements Transport
 *       drv  -> forward thrust + yaw torque on the chassis body
 *       sensors:
 *         hcsr04  -> Rapier castRay forward from the mount, clamp 4 m + noise
 *         mpu6050 -> read body orientation / angular velocity
 *       battery  -> drain proportional to motor effort
 *
 * See docs/adr/0002-sim-as-transport.md
 */

export const SIM_PLACEHOLDER = true as const;
