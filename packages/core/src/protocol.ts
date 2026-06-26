/**
 * Wire protocol — the transport-agnostic message vocabulary.
 *
 * The same messages ride over WiFi, BLE, USB serial, or the simulator. Keep it
 * small and JSON-friendly; a compact binary encoding can slot in behind
 * encode()/decode() later without touching callers.
 */

import type { SensorConfig } from './robotProfile';

// ── App → Robot ────────────────────────────────────────────────────────────

/** Continuous drive command. throttle/steer in -1..1. */
export interface DriveMsg {
  t: 'drv';
  thr: number;
  str: number;
}

export type ActionName =
  | 'estop'
  | 'stop'
  | 'horn'
  | 'light_on'
  | 'light_off'
  | 'measure';

/** Discrete one-shot action. */
export interface CmdMsg {
  t: 'cmd';
  a: ActionName;
}

/** Push runtime sensor config (V1 firmware reads this instead of recompiling). */
export interface CfgMsg {
  t: 'cfg';
  sensors: SensorConfig[];
}

/** Ask the robot to describe itself. */
export interface ManifestReqMsg {
  t: 'manifest?';
}

// ── Robot → App ────────────────────────────────────────────────────────────

/** Capability manifest — what am I, what do I have. Drives the dynamic UI. */
export interface ManifestMsg {
  t: 'manifest';
  board: string;
  fw: string;
  drive: string;
  transports: string[];
  /** sensor drivers this firmware can instantiate */
  drivers: string[];
}

/** A telemetry reading: a scalar, or a small bag of named scalars (e.g. IMU). */
export type TelemetryValue = number | Record<string, number>;

/** Telemetry frame. */
export interface TelemetryMsg {
  t: 'tel';
  /** robot uptime, ms */
  ts: number;
  /** sensorId -> reading */
  s: Record<string, TelemetryValue>;
  /** battery volts, if reported */
  batt?: number;
  /** robot speed, m/s (signed; + is forward) */
  spd?: number;
}

/** Log / status line from the robot. */
export interface LogMsg {
  t: 'log';
  level: 'info' | 'warn' | 'error';
  msg: string;
}

// ── Unions ─────────────────────────────────────────────────────────────────

export type AppToRobot = DriveMsg | CmdMsg | CfgMsg | ManifestReqMsg;
export type RobotToApp = ManifestMsg | TelemetryMsg | LogMsg;
export type ProtocolMsg = AppToRobot | RobotToApp;

export function encode(msg: AppToRobot): string {
  return JSON.stringify(msg);
}

export function decode(raw: string): RobotToApp | null {
  try {
    const obj = JSON.parse(raw) as RobotToApp;
    if (obj && typeof obj === 'object' && typeof (obj as { t?: unknown }).t === 'string') {
      return obj;
    }
    return null;
  } catch {
    return null;
  }
}
