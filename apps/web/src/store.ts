import { create } from 'zustand';
import {
  MockTransport,
  SafetyGuard,
  createEsp32FourWheelCar,
  type ActionName,
  type ConnectionState,
  type ManifestMsg,
  type RobotProfile,
  type RobotToApp,
  type TelemetryMsg,
  type Transport,
} from '@roboforge/core';

export interface TelemetrySample {
  t: number;
  spd: number;
  batt: number;
  dist: number;
}

const HISTORY = 120; // ~12 s at 10 Hz

interface RobotStore {
  profile: RobotProfile;
  transport: Transport | null;
  safety: SafetyGuard | null;
  connection: ConnectionState;
  manifest: ManifestMsg | null;
  telemetry: TelemetryMsg | null;
  history: TelemetrySample[];

  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  drive: (thr: number, str: number) => void;
  estop: () => void;
  action: (a: ActionName) => void;
}

/**
 * App state. The whole control loop is core's Transport + SafetyGuard.
 * Swapping MockTransport for SimTransport or WebSocketTransport is one line.
 */
export const useRobot = create<RobotStore>((set, get) => ({
  profile: createEsp32FourWheelCar(),
  transport: null,
  safety: null,
  connection: 'disconnected',
  manifest: null,
  telemetry: null,
  history: [],

  connect: async () => {
    const { profile, transport: existing } = get();
    if (existing) await existing.disconnect();

    const transport = new MockTransport(profile); // ← becomes Sim/WebSocket transport later
    transport.on('state', (connection) => set({ connection }));
    transport.on('message', (msg: RobotToApp) => {
      if (msg.t === 'manifest') {
        set({ manifest: msg });
      } else if (msg.t === 'tel') {
        const distRaw = msg.s['dist_front'];
        const sample: TelemetrySample = {
          t: msg.ts,
          spd: msg.spd ?? 0,
          batt: msg.batt ?? 0,
          dist: typeof distRaw === 'number' ? distRaw : 0,
        };
        set((s) => ({ telemetry: msg, history: [...s.history, sample].slice(-HISTORY) }));
      }
    });

    const safety = new SafetyGuard(transport);
    await transport.connect();
    safety.start();
    set({ transport, safety });
  },

  disconnect: async () => {
    const { transport, safety } = get();
    safety?.dispose();
    await transport?.disconnect();
    set({ transport: null, safety: null, manifest: null, telemetry: null, history: [] });
  },

  drive: (thr, str) => get().safety?.drive(thr, str),
  estop: () => get().safety?.stop(),
  action: (a) => get().transport?.send({ t: 'cmd', a }),
}));
