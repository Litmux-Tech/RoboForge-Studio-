import { create } from 'zustand';
import {
  MockTransport,
  SafetyGuard,
  createEsp32FourWheelCar,
  type ConnectionState,
  type ManifestMsg,
  type RobotProfile,
  type RobotToApp,
  type TelemetryMsg,
  type Transport,
} from '@roboforge/core';

interface RobotStore {
  profile: RobotProfile;
  transport: Transport | null;
  safety: SafetyGuard | null;
  connection: ConnectionState;
  manifest: ManifestMsg | null;
  telemetry: TelemetryMsg | null;

  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  drive: (thr: number, str: number) => void;
  estop: () => void;
}

/**
 * App state. Note how little there is: the whole control loop is `core`'s
 * Transport + SafetyGuard. Swapping MockTransport for a real WebSocketTransport
 * later changes exactly one line below — the UI doesn't move.
 */
export const useRobot = create<RobotStore>((set, get) => ({
  profile: createEsp32FourWheelCar(),
  transport: null,
  safety: null,
  connection: 'disconnected',
  manifest: null,
  telemetry: null,

  connect: async () => {
    const { profile, transport: existing } = get();
    if (existing) await existing.disconnect();

    const transport = new MockTransport(profile); // ← the one line that becomes WebSocketTransport
    transport.on('state', (connection) => set({ connection }));
    transport.on('message', (msg: RobotToApp) => {
      if (msg.t === 'manifest') set({ manifest: msg });
      else if (msg.t === 'tel') set({ telemetry: msg });
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
    set({ transport: null, safety: null, manifest: null, telemetry: null });
  },

  drive: (thr, str) => get().safety?.drive(thr, str),
  estop: () => get().safety?.stop(),
}));
