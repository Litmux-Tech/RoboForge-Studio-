/**
 * SimTransport — the simulator as a Transport.
 *
 * A pure-TS kinematic model (no 3D/physics-engine deps) that implements the
 * same `Transport` interface as the real-robot links. The control UI sends the
 * same protocol messages here as it would to a real ESP32, so "same logic for
 * sim and real" holds. The R3F scene is a *pure renderer* on top: it reads
 * `pose` / `obstacles` each frame and draws them.
 *
 * V1 uses a simple differential-drive kinematic model + an analytic forward
 * raycast for the ultrasonic. Rapier (real physics + collisions) is a later
 * upgrade behind this same interface. See docs/adr/0002-sim-as-transport.md.
 */

import { BaseTransport } from '@roboforge/core';
import type { AppToRobot, RobotProfile } from '@roboforge/core';

export interface Obstacle {
  x: number;
  z: number;
  r: number;
}

export interface Pose2D {
  x: number;
  z: number;
  yaw: number;
}

export class SimTransport extends BaseTransport {
  readonly kind = 'sim';

  /** Live car pose — the renderer reads this every frame. */
  pose: Pose2D = { x: 0, z: 0, yaw: 0 };
  /** Latest forward ultrasonic distance, metres — the renderer draws the beam from this. */
  frontDistanceM = 4;
  /** Arena half-size, metres (walls act as ultrasonic targets too). */
  readonly arena = 2.5;
  readonly obstacles: Obstacle[] = [
    { x: 1.0, z: 0.8, r: 0.18 },
    { x: -1.2, z: 0.5, r: 0.18 },
    { x: 0.3, z: -1.4, r: 0.18 },
    { x: -0.7, z: -0.9, r: 0.18 },
  ];

  private thr = 0;
  private str = 0;
  private batt = 8.2;
  private uptime = 0;
  private accSinceTel = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly stepMs = 50; // 20 Hz physics step

  constructor(private readonly profile: RobotProfile) {
    super();
  }

  async connect(): Promise<void> {
    this.setState('connecting');
    await delay(120);
    this.setState('connected');
    this.emit('message', {
      t: 'manifest',
      board: this.profile.board,
      fw: 'sim-0.1.0',
      drive: this.profile.drive.kind,
      transports: this.profile.transports,
      drivers: [...new Set(this.profile.sensors.map((s) => s.driver))],
    });
    this.timer = setInterval(() => this.step(), this.stepMs);
  }

  async disconnect(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.setState('disconnected');
  }

  send(msg: AppToRobot): void {
    if (this.state !== 'connected') return;
    if (msg.t === 'drv') {
      this.thr = clamp(msg.thr, -1, 1);
      this.str = clamp(msg.str, -1, 1);
    } else if (msg.t === 'cmd' && (msg.a === 'estop' || msg.a === 'stop')) {
      this.thr = 0;
      this.str = 0;
    }
  }

  reset(): void {
    this.pose = { x: 0, z: 0, yaw: 0 };
    this.thr = 0;
    this.str = 0;
  }

  private step(): void {
    const dt = this.stepMs / 1000;
    this.uptime += this.stepMs;

    const maxSpeed = this.profile.drive.maxSpeed ?? 1.5;
    const v = this.thr * maxSpeed;
    const yawRate = this.str * 2.2; // rad/s at full steer

    this.pose.yaw += yawRate * dt;
    this.pose.x += v * Math.sin(this.pose.yaw) * dt;
    this.pose.z += v * Math.cos(this.pose.yaw) * dt;

    // keep the car inside the arena so it stays in view
    const a = this.arena - 0.15;
    this.pose.x = clamp(this.pose.x, -a, a);
    this.pose.z = clamp(this.pose.z, -a, a);

    this.batt = clamp(this.batt - Math.abs(this.thr) * 0.0015 - 0.0003, 6.0, 8.4);
    this.frontDistanceM = this.raycastForward();

    this.accSinceTel += this.stepMs;
    if (this.accSinceTel >= 100) {
      // 10 Hz telemetry
      this.accSinceTel = 0;
      const distCm = this.frontDistanceM * 100;
      const s: Record<string, number | Record<string, number>> = {};
      for (const sensor of this.profile.sensors) {
        if (sensor.driver === 'hcsr04' || sensor.driver === 'vl53l0x') {
          s[sensor.id] = round(distCm, 1);
        } else if (sensor.driver === 'mpu6050') {
          s[sensor.id] = { yaw: round(this.pose.yaw, 3), pitch: 0, roll: 0 };
        }
      }
      this.emit('message', { t: 'tel', ts: this.uptime, s, batt: round(this.batt, 2), spd: round(v, 2) });
    }
  }

  /** Distance (m) from the car's front along its heading to the nearest obstacle or wall, clamped to 4 m. */
  private raycastForward(): number {
    const dirX = Math.sin(this.pose.yaw);
    const dirZ = Math.cos(this.pose.yaw);
    const nose = (this.profile.drive.wheelBase ?? 0.16) * 0.85;
    const ox = this.pose.x + dirX * nose;
    const oz = this.pose.z + dirZ * nose;

    let best = 4.0;
    for (const o of this.obstacles) {
      const t = rayCircle(ox, oz, dirX, dirZ, o.x, o.z, o.r);
      if (t != null && t < best) best = t;
    }
    const wall = rayBox(ox, oz, dirX, dirZ, this.arena);
    if (wall != null && wall < best) best = wall;
    return Math.max(0.02, best);
  }
}

// ── math helpers (dir is unit length, so quadratic a = 1) ───────────────────

function rayCircle(
  ox: number,
  oz: number,
  dx: number,
  dz: number,
  cx: number,
  cz: number,
  r: number,
): number | null {
  const fx = ox - cx;
  const fz = oz - cz;
  const b = 2 * (fx * dx + fz * dz);
  const c = fx * fx + fz * fz - r * r;
  const disc = b * b - 4 * c;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const t1 = (-b - sq) / 2;
  if (t1 >= 0) return t1;
  const t2 = (-b + sq) / 2;
  return t2 >= 0 ? t2 : null;
}

/** Exit distance from inside an axis-aligned square of half-size A. */
function rayBox(ox: number, oz: number, dx: number, dz: number, A: number): number | null {
  let best: number | null = null;
  const consider = (t: number) => {
    if (t > 1e-4 && (best == null || t < best)) best = t;
  };
  if (dx > 1e-6) consider((A - ox) / dx);
  else if (dx < -1e-6) consider((-A - ox) / dx);
  if (dz > 1e-6) consider((A - oz) / dz);
  else if (dz < -1e-6) consider((-A - oz) / dz);
  return best;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
function round(v: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
