import { create } from 'zustand';
import { SimTransport } from '@roboforge/sim';
import {
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
  yaw: number;
}

export interface LogLine {
  t: number;
  level: 'sys' | 'rx' | 'tx' | 'err';
  msg: string;
}

const HISTORY = 120; // ~12 s at 10 Hz
const LOG_MAX = 200;

interface RobotStore {
  profile: RobotProfile;
  transport: Transport | null;
  safety: SafetyGuard | null;
  connection: ConnectionState;
  manifest: ManifestMsg | null;
  telemetry: TelemetryMsg | null;
  history: TelemetrySample[];
  log: LogLine[];

  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  drive: (thr: number, str: number) => void;
  estop: () => void;
  action: (a: ActionName) => void;
  clearLog: () => void;
  runCommand: (line: string) => void;
}

/**
 * App state. The control loop is core's Transport + SafetyGuard; swapping
 * SimTransport for WebSocketTransport is one line. A bounded log buffer feeds
 * the Terminal page with real protocol traffic.
 */
export const useRobot = create<RobotStore>((set, get) => {
  const pushLog = (level: LogLine['level'], msg: string) =>
    set((s) => ({ log: [...s.log, { t: Date.now(), level, msg }].slice(-LOG_MAX) }));

  return {
    profile: createEsp32FourWheelCar(),
    transport: null,
    safety: null,
    connection: 'disconnected',
    manifest: null,
    telemetry: null,
    history: [],
    log: [],

    connect: async () => {
      const { profile, transport: existing } = get();
      if (existing) await existing.disconnect();
      pushLog('sys', 'Connecting…');

      const transport = new SimTransport(profile); // ← swap for WebSocketTransport to drive a real ESP32
      let telCount = 0;

      transport.on('state', (connection) => {
        set({ connection });
        if (connection === 'connected') pushLog('sys', 'Connected (192.168.4.1)');
        else if (connection === 'disconnected') pushLog('sys', 'Disconnected');
        else if (connection === 'error') pushLog('err', 'Connection error');
      });

      transport.on('message', (msg: RobotToApp) => {
        if (msg.t === 'manifest') {
          set({ manifest: msg });
          pushLog('rx', `manifest · ${msg.board} · fw ${msg.fw} · drivers ${msg.drivers.join(',')}`);
        } else if (msg.t === 'tel') {
          const distRaw = msg.s['dist_front'];
          const dist = typeof distRaw === 'number' ? distRaw : 0;
          const imuRaw = msg.s['imu'];
          const yaw = imuRaw && typeof imuRaw === 'object' ? imuRaw.yaw ?? 0 : 0;
          set((s) => ({
            telemetry: msg,
            history: [...s.history, { t: msg.ts, spd: msg.spd ?? 0, batt: msg.batt ?? 0, dist, yaw }].slice(-HISTORY),
          }));
          if (telCount++ % 10 === 0) {
            pushLog('rx', `tel · batt ${(msg.batt ?? 0).toFixed(2)}V · spd ${(msg.spd ?? 0).toFixed(2)}m/s · dist ${dist.toFixed(0)}cm`);
          }
        } else if (msg.t === 'log') {
          pushLog(msg.level === 'error' ? 'err' : 'rx', msg.msg);
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
    estop: () => {
      get().safety?.stop();
      pushLog('tx', 'cmd · estop');
    },
    action: (a) => {
      get().transport?.send({ t: 'cmd', a });
      pushLog('tx', `cmd · ${a}`);
    },
    clearLog: () => set({ log: [] }),
    runCommand: (line) => {
      const c = line.trim();
      if (!c) return;
      pushLog('tx', `> ${c}`);
      const lc = c.toLowerCase();
      if (lc === 'clear') set({ log: [] });
      else if (lc === 'stop' || lc === 'estop') get().estop();
      else if (lc === 'help') pushLog('sys', 'commands: stop · clear · help');
      else pushLog('err', `unknown command: ${c}`);
    },
  };
});
