/**
 * SafetyGuard — the deadman switch.
 *
 * A moving robot MUST stop if the app goes quiet or the link drops. This is the
 * difference between a toy and something engineered. SafetyGuard:
 *   - re-sends the latest drive command as a heartbeat (keep-alive),
 *   - forces a stop if no fresh command arrives within `timeoutMs`,
 *   - forces a stop on disconnect / error.
 *
 * The matching firmware side enforces the same timeout independently, so a
 * crashed app or dead WiFi link also stops the motors.
 */

import type { Transport } from './transport/transport';
import type { DriveMsg } from './protocol';

export interface SafetyOptions {
  /** stop if no fresh drive command within this window (ms) */
  timeoutMs?: number;
  /** keep-alive re-send interval (ms) */
  heartbeatMs?: number;
  /** clock source — injectable for tests */
  now?: () => number;
}

export class SafetyGuard {
  private last: DriveMsg = { t: 'drv', thr: 0, str: 0 };
  private lastSentAt = 0;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private offState: (() => void) | null = null;

  private readonly timeoutMs: number;
  private readonly heartbeatMs: number;
  private readonly now: () => number;

  constructor(private readonly transport: Transport, opts: SafetyOptions = {}) {
    this.timeoutMs = opts.timeoutMs ?? 400;
    this.heartbeatMs = opts.heartbeatMs ?? 100;
    this.now = opts.now ?? (() => performance.now());
  }

  start(): void {
    this.lastSentAt = this.now();
    this.offState = this.transport.on('state', (s) => {
      if (s === 'disconnected' || s === 'error') this.stop();
    });
    this.heartbeat = setInterval(() => {
      if (this.now() - this.lastSentAt > this.timeoutMs) {
        // app went quiet -> coast to a stop
        this.last = { t: 'drv', thr: 0, str: 0 };
      }
      this.transport.send(this.last);
    }, this.heartbeatMs);
  }

  /** Call on every fresh user/behavior command. */
  drive(thr: number, str: number): void {
    this.last = { t: 'drv', thr, str };
    this.lastSentAt = this.now();
    this.transport.send(this.last);
  }

  /** Emergency stop. */
  stop(): void {
    this.last = { t: 'drv', thr: 0, str: 0 };
    this.transport.send({ t: 'cmd', a: 'estop' });
  }

  dispose(): void {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
    this.offState?.();
  }
}
