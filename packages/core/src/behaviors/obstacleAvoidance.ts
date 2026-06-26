/**
 * Obstacle avoidance — the canonical V1 autonomous behavior.
 *
 * A PURE function of the latest telemetry -> a drive output. This is the single
 * source of truth: it runs in TypeScript here (against the simulator OR a real
 * robot, identically), and it is the reference that packages/codegen transpiles
 * into the generated C++ firmware. Keep it tiny and branch-simple so the TS and
 * the generated C++ stay in lock-step.
 */

import type { TelemetryMsg } from '../protocol';

export interface DriveOutput {
  thr: number;
  str: number;
}

export interface ObstacleAvoidanceConfig {
  /** sensor id reporting forward distance, in cm */
  distanceSensorId: string;
  /** cm: closer than this -> start avoiding */
  stopDistanceCm: number;
  /** cm: clear beyond this -> resume forward (hysteresis upper bound) */
  clearDistanceCm: number;
  cruiseThrottle: number; // 0..1
  turnSteer: number; // -1..1, applied while avoiding
}

export const DEFAULT_OBSTACLE_AVOIDANCE: ObstacleAvoidanceConfig = {
  distanceSensorId: 'dist_front',
  stopDistanceCm: 25,
  clearDistanceCm: 40,
  cruiseThrottle: 0.6,
  turnSteer: 0.8,
};

/**
 * One control step. `prevAvoiding` carries the hysteresis state so the robot
 * doesn't jitter right at the threshold.
 */
export function obstacleAvoidanceStep(
  tel: TelemetryMsg,
  cfg: ObstacleAvoidanceConfig = DEFAULT_OBSTACLE_AVOIDANCE,
  prevAvoiding = false,
): { drive: DriveOutput; avoiding: boolean } {
  const reading = tel.s[cfg.distanceSensorId];
  const distance = typeof reading === 'number' ? reading : Number.POSITIVE_INFINITY;

  const avoiding = prevAvoiding
    ? distance < cfg.clearDistanceCm
    : distance < cfg.stopDistanceCm;

  const drive: DriveOutput = avoiding
    ? { thr: 0, str: cfg.turnSteer } // pivot until clear
    : { thr: cfg.cruiseThrottle, str: 0 }; // cruise forward

  return { drive, avoiding };
}
