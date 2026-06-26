/**
 * Transport — the unification point.
 *
 * A Transport is the ONLY thing that differs between a simulated robot and a
 * real one. The control UI, dashboards, and behaviors all speak ProtocolMsg and
 * never know which transport is underneath:
 *
 *   SimTransport        -> applies commands to a Rapier rigid body (packages/sim)
 *   WebSocketTransport  -> sends to a real ESP32 over WiFi
 *   BleTransport        -> sends over Bluetooth LE
 *   MockTransport       -> a self-contained fake car for hardware-free dev
 */

import type { AppToRobot, RobotToApp } from '../protocol';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface TransportEvents {
  message: (msg: RobotToApp) => void;
  state: (state: ConnectionState) => void;
  error: (err: Error) => void;
}

export interface Transport {
  readonly kind: string;
  readonly state: ConnectionState;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(msg: AppToRobot): void;
  on<E extends keyof TransportEvents>(event: E, cb: TransportEvents[E]): () => void;
}

/** Typed event-emitter base that concrete transports extend. */
export abstract class BaseTransport implements Transport {
  abstract readonly kind: string;
  protected _state: ConnectionState = 'disconnected';

  private listeners: { [K in keyof TransportEvents]: Set<TransportEvents[K]> } = {
    message: new Set(),
    state: new Set(),
    error: new Set(),
  };

  get state(): ConnectionState {
    return this._state;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(msg: AppToRobot): void;

  on<E extends keyof TransportEvents>(event: E, cb: TransportEvents[E]): () => void {
    this.listeners[event].add(cb);
    return () => {
      this.listeners[event].delete(cb);
    };
  }

  protected emit<E extends keyof TransportEvents>(
    event: E,
    ...args: Parameters<TransportEvents[E]>
  ): void {
    for (const cb of this.listeners[event]) {
      (cb as (...a: unknown[]) => void)(...args);
    }
  }

  protected setState(state: ConnectionState): void {
    if (state === this._state) return;
    this._state = state;
    this.emit('state', state);
  }
}
