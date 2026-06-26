/**
 * MockTransport — a self-contained fake robot.
 *
 * Lets the whole app + UI be developed with zero hardware. This is NOT the
 * physics simulator (that's packages/sim, also a Transport) — just a believable
 * telemetry generator so dashboards have something live to render from day one.
 */

import { BaseTransport } from './transport';
import type { AppToRobot } from '../protocol';
import type { RobotProfile } from '../robotProfile';

export class MockTransport extends BaseTransport {
  readonly kind = 'mock';

  private timer: ReturnType<typeof setInterval> | null = null;
  private thr = 0;
  private str = 0;
  private yaw = 0;
  private batt = 8.2;
  private dist = 1.2; // metres to a fake wall ahead
  private uptime = 0;
  private readonly tickMs = 100; // 10 Hz telemetry

  constructor(private readonly profile: RobotProfile) {
    super();
  }

  async connect(): Promise<void> {
    this.setState('connecting');
    await delay(150);
    this.setState('connected');
    this.emit('message', {
      t: 'manifest',
      board: this.profile.board,
      fw: 'mock-0.1.0',
      drive: this.profile.drive.kind,
      transports: this.profile.transports,
      drivers: [...new Set(this.profile.sensors.map((s) => s.driver))],
    });
    this.timer = setInterval(() => this.tick(), this.tickMs);
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
    switch (msg.t) {
      case 'drv':
        this.thr = clamp(msg.thr, -1, 1);
        this.str = clamp(msg.str, -1, 1);
        break;
      case 'cmd':
        if (msg.a === 'estop' || msg.a === 'stop') {
          this.thr = 0;
          this.str = 0;
        }
        break;
      // 'cfg' / 'manifest?' are accepted silently by the mock
    }
  }

  private tick(): void {
    this.uptime += this.tickMs;
    const dt = this.tickMs / 1000;

    // toy kinematics
    this.yaw += this.str * 1.5 * dt;
    const speed = this.thr * (this.profile.drive.maxSpeed ?? 1.5);
    // fake wall ahead: closer as we drive forward, eased by turning away
    this.dist = clamp(this.dist - speed * dt + Math.abs(this.str) * 0.05 * dt * 10, 0.02, 4);
    // battery drains with motor effort
    this.batt = clamp(this.batt - Math.abs(this.thr) * 0.002 - 0.0005, 6.0, 8.4);

    const s: Record<string, number | Record<string, number>> = {};
    for (const sensor of this.profile.sensors) {
      if (sensor.driver === 'hcsr04' || sensor.driver === 'vl53l0x') {
        s[sensor.id] = round(this.dist * 100, 1); // cm
      } else if (sensor.driver === 'mpu6050') {
        s[sensor.id] = { yaw: round(this.yaw, 3), pitch: 0, roll: 0 };
      }
    }

    this.emit('message', { t: 'tel', ts: this.uptime, s, batt: round(this.batt, 2) });
  }
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
