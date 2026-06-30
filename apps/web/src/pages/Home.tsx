import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderOpen,
  Upload,
  LayoutGrid,
  Wifi,
  Battery,
  Gauge as GaugeIcon,
  Code2,
  Cpu,
  Gamepad2,
  Crosshair,
  Mic,
  Disc,
  Camera,
  ScrollText,
  Share2,
  Rocket,
  CircuitBoard,
  Radar,
  Car,
  GitFork,
  Bot,
  ChevronRight,
} from 'lucide-react';
import { SimTransport } from '@roboforge/sim';
import { useRobot } from '../store';
import { Card } from '../components/Card';
import { SimScene } from '../sim/SimScene';

const QUICK = [
  { label: 'Generate Firmware', icon: Code2, color: 'bg-emerald-500/15 text-emerald-300' },
  { label: 'Flash to ESP32', icon: Cpu, color: 'bg-cyan-500/15 text-cyan-300', to: '/flash' },
  { label: 'Control Robot', icon: Gamepad2, color: 'bg-violet-500/15 text-violet-300', to: '/control' },
  { label: 'Calibrate Sensors', icon: Crosshair, color: 'bg-blue-500/15 text-blue-300' },
  { label: 'Voice Control', icon: Mic, color: 'bg-fuchsia-500/15 text-fuchsia-300' },
  { label: 'Record Data', icon: Disc, color: 'bg-rose-500/15 text-rose-300' },
  { label: 'Take Snapshot', icon: Camera, color: 'bg-amber-500/15 text-amber-300' },
  { label: 'View Logs', icon: ScrollText, color: 'bg-slate-500/15 text-slate-300' },
  { label: 'Share Project', icon: Share2, color: 'bg-teal-500/15 text-teal-300' },
];

const RECENT = [
  { name: '4WD Explorer Bot', sub: 'Modified 2h ago', icon: Car, tint: 'from-blue-500/20' },
  { name: 'Line Follower Bot', sub: 'Modified 1d ago', icon: GitFork, tint: 'from-emerald-500/20' },
  { name: 'Obstacle Avoider', sub: 'Modified 3d ago', icon: Radar, tint: 'from-violet-500/20' },
  { name: 'Robotic Arm', sub: 'Modified 5d ago', icon: Bot, tint: 'from-amber-500/20' },
];

const LESSONS = [
  { title: 'Getting Started with RoboForge', sub: '12 Lessons', pct: 60, icon: Rocket, color: 'bg-cyan-500' },
  { title: 'Understanding Motor Drivers', sub: '8 Lessons', pct: 45, icon: CircuitBoard, color: 'bg-emerald-500' },
  { title: 'Sensor Basics & Interfacing', sub: '10 Lessons', pct: 30, icon: Radar, color: 'bg-violet-500' },
];

export function Home() {
  const nav = useNavigate();
  const { profile, connection, telemetry, transport, connect, disconnect } = useRobot();
  const connected = connection === 'connected';
  const sim = transport instanceof SimTransport ? transport : null;
  const battV = telemetry?.batt ?? 0;
  const battPct = Math.round(clamp01((battV - 6) / (8.4 - 6)) * 100);
  const speed = Math.abs(telemetry?.spd ?? 0);
  const maxSpeed = profile.drive.maxSpeed ?? 1.5;
  const uptime = telemetry ? fmtTime(telemetry.ts) : '00:00:00';

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex min-h-full flex-col gap-3 p-4">
        <div>
          <h1 className="text-xl font-semibold">Welcome back, Engineer 👋</h1>
          <p className="text-sm text-slate-400">Design, simulate, learn and control robots — all in one place.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ActionCard primary icon={<Plus size={18} />} title="New Project" sub="Start a new robot project" />
          <ActionCard icon={<FolderOpen size={18} />} title="Open Project" sub="Open existing project" />
          <ActionCard icon={<Upload size={18} />} title="Import" sub="Import 3D model / project" />
          <ActionCard icon={<LayoutGrid size={18} />} title="Templates" sub="Browse robot templates" />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_300px]">
          <Card title="QUICK SIMULATION" right={<LiveBadge on={connected} />}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[190px_1fr]">
              <div className="flex flex-col gap-2.5 text-sm">
                <div>
                  <div className="font-semibold">{profile.name}</div>
                  <div className="text-xs leading-snug text-slate-500">
                    ESP32 4-wheel drive robot with obstacle avoidance
                  </div>
                </div>
                <Meter icon={<Battery size={13} />} label="Battery" value={`${battPct}%`} pct={battPct} color="bg-emerald-500" />
                <Meter icon={<GaugeIcon size={13} />} label="Speed" value={`${speed.toFixed(2)} m/s`} pct={(speed / maxSpeed) * 100} color="bg-cyan-500" />
                <Field label="Mode" value="Manual" />
                <Field label="Connection" value={connected ? 'WiFi' : '—'} dot={connected} />
                <button
                  onClick={() => (connected ? nav('/control') : void connect())}
                  className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
                >
                  ▶ {connected ? 'Open Live Control' : 'Start Simulation'}
                </button>
                <button
                  onClick={() => nav('/control')}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
                >
                  View Dashboard
                </button>
              </div>
              <div className="relative h-[38vh] min-h-[260px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                <SimScene profile={profile} sim={sim} />
                <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-lg bg-black/40 p-1 backdrop-blur">
                  {['Select', 'Move', 'Rotate', 'Zoom', 'Camera', 'Reset'].map((t, i) => (
                    <span key={t} className={`rounded px-2 py-1 text-[10px] ${i === 1 ? 'bg-cyan-500/30 text-cyan-200' : 'text-slate-400'}`}>
                      {t}
                    </span>
                  ))}
                </div>
                {!connected && (
                  <div className="absolute inset-0 grid place-items-center text-xs text-slate-500">
                    Press “Start Simulation”
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            <Card
              title="CONNECTION STATUS"
              right={
                connected ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">Connected</span>
                ) : null
              }
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="grid h-10 w-14 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-[10px] text-slate-400">
                  ESP32
                </div>
                <div>
                  <div className="text-sm font-semibold">{profile.board.toUpperCase()} DevKit</div>
                  <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <Wifi size={11} /> {connected ? 'Good Signal' : 'Offline'}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <StatRow label="Address" value={connected ? '192.168.4.1' : '—'} />
                <StatRow label="Protocol" value={connected ? 'WiFi (Sim)' : '—'} />
                <StatRow label="Uptime" value={uptime} />
              </div>
              {connected && (
                <button
                  onClick={() => void disconnect()}
                  className="mt-2 w-full rounded-lg border border-rose-500/40 bg-rose-500/10 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
                >
                  Disconnect
                </button>
              )}
            </Card>

            <Card title="QUICK ACTIONS">
              <div className="grid grid-cols-3 gap-2">
                {QUICK.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => a.to && nav(a.to)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 px-1 py-2.5 text-center text-[10px] leading-tight text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800/60"
                  >
                    <span className={`grid h-8 w-8 place-items-center rounded-lg ${a.color}`}>
                      <a.icon size={15} />
                    </span>
                    {a.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_340px]">
          <Card title="RECENT PROJECTS">
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {RECENT.map((p) => (
                <div
                  key={p.name}
                  className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 transition-colors hover:border-slate-700"
                >
                  <div className={`mb-2 grid h-14 place-items-center rounded-lg bg-gradient-to-br ${p.tint} to-slate-900`}>
                    <p.icon size={22} className="text-slate-300" />
                  </div>
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="text-[11px] text-slate-500">{p.sub}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="LEARNING CENTER">
            <div className="space-y-2.5">
              {LESSONS.map((l) => (
                <div key={l.title} className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-800 text-slate-300">
                    <l.icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="truncate text-xs font-medium">{l.title}</div>
                      <span className="text-[10px] text-slate-500">{l.pct}%</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{l.sub}</div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${l.color}`} style={{ width: `${l.pct}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function ActionCard({ icon, title, sub, primary }: { icon: ReactNode; title: string; sub: string; primary?: boolean }) {
  return (
    <button
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
        primary
          ? 'border-transparent bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500'
          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/60'
      }`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${primary ? 'bg-white/20' : 'bg-slate-800 text-cyan-300'}`}>
        {icon}
      </span>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className={`text-xs ${primary ? 'text-white/80' : 'text-slate-500'}`}>{sub}</div>
      </div>
    </button>
  );
}

function Meter({ icon, label, value, pct, color }: { icon: ReactNode; label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          {icon}
          {label}
        </span>
        <span className="font-medium text-slate-200">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  );
}

function Field({ label, value, dot }: { label: string; value: string; dot?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-1.5 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="flex items-center gap-1.5 font-medium text-slate-200">
        {dot !== undefined && <span className={`h-1.5 w-1.5 rounded-full ${dot ? 'bg-emerald-400' : 'bg-slate-600'}`} />}
        {value}
      </span>
    </div>
  );
}

function LiveBadge({ on }: { on: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] ${
        on ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/40 text-slate-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${on ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'}`} />
      {on ? 'LIVE' : 'IDLE'}
    </span>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium tabular-nums text-slate-200">{value}</span>
    </div>
  );
}
