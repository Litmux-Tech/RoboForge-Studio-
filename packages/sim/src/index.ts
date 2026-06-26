/**
 * @roboforge/sim — the simulation.
 *
 * `SimTransport` (pure TS, a real Transport) is the engine; the R3F renderer
 * lives in the app and draws the transport's pose/obstacles each frame.
 *
 * See docs/adr/0002-sim-as-transport.md
 */

export { SimTransport } from './simTransport';
export type { Obstacle, Pose2D } from './simTransport';
