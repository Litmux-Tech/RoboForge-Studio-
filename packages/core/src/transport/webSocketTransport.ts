/**
 * WebSocketTransport — drive a real robot over WiFi.
 *
 * Connects to the ESP32's WebSocket server (roverlib) and speaks the exact same
 * protocol as the simulator and the mock. Swapping this in for SimTransport is
 * the whole point of the Transport abstraction: the UI never changes.
 *
 * Uses the platform `WebSocket` global (present in browsers, React Native, and
 * Node 18+), so this stays in the platform-agnostic core.
 */

import { BaseTransport } from './transport';
import { decode, encode } from '../protocol';
import type { AppToRobot } from '../protocol';

export class WebSocketTransport extends BaseTransport {
  readonly kind = 'wifi-ws';
  private ws: WebSocket | null = null;

  /** e.g. "ws://192.168.4.1:81" */
  constructor(
    private readonly url: string,
    private readonly timeoutMs = 6000,
  ) {
    super();
  }

  async connect(): Promise<void> {
    this.setState('connecting');
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const ws = new WebSocket(this.url);
      this.ws = ws;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        ws.close();
        this.setState('error');
        reject(new Error(`connect timeout (${this.url})`));
      }, this.timeoutMs);

      ws.onopen = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.setState('connected');
        this.send({ t: 'manifest?' });
        resolve();
      };
      ws.onmessage = (ev) => {
        if (typeof ev.data !== 'string') return; // we use text frames
        const msg = decode(ev.data);
        if (msg) this.emit('message', msg);
      };
      ws.onerror = () => {
        const err = new Error('websocket error');
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          this.setState('error');
          reject(err);
        } else {
          this.emit('error', err);
        }
      };
      ws.onclose = () => {
        this.setState('disconnected');
      };
    });
  }

  async disconnect(): Promise<void> {
    this.ws?.close();
    this.ws = null;
    this.setState('disconnected');
  }

  send(msg: AppToRobot): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(encode(msg));
    }
  }
}
