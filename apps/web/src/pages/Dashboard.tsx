import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Wifi,
  Car,
  Gamepad2,
  Mic,
  Lightbulb,
  Volume2,
  Ruler,
  Power,
  Cpu,
  Signal,
  ChevronDown,
} from 'lucide-react';
import { useRobot } from '../store';
import { Card } from '../components/Card';
import { Gauge } from '../components/Gauge';
import { Joystick } from '../components/Joystick';
import { LiveChart } from '../components/LiveChart';
import { SensorReadings } from '../components/SensorReadings';

export function Dashboard() {
  const { profile, connection, manifest, telemetry, history, connect, disconnect, drive, estop, action } =
    useRobot();
  const connected = connection === 'connected';
  const [headlight, setHeadlight] = useState(false);
  const [mode, setMode] = useState('manual');

  const maxSpeed = profile.drive.maxSpeed ?? 1.5;
  const speed = Math.abs(telemetry?.spd ?? 0);
  const battV = telemetry?.batt ?? 0;
  const battPct = Math.round(clamp01((battV - 6.0) / (8.4 - 6.0)) * 100);
  const distRaw = telemetry?.s['dist_front'];
  const dist = typeof distRaw === 'number' ? distRaw : null;

  const series = [
    { name: 'Speed (m/s)', color: '#22d3ee', data: history.map((h) => h.spd) },
    { name: 'Battery (V)', color: '#34d399', data: history.map((h) => h.batt) },
    { name: 'Distance (cm)', color: '#a78bfa', data: history.map((h) => h.dist) },
  ];

  const toggleHeadlight = () => {
    const next = !headlight;
    setHeadlight(next);
    action(next ? 'light_on' : 'light_off');
  };

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Welcome back, Engineer 👋</h1>
          <p className="text-sm text-slate-400">Design, simulate, and control robots — all in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              connected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/40 text-slate-300'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {connection}
          </span>
          {connected ? (
            <button
              onClick={() => void disconnect()}
              className="rounded-lg bg-rose-500/90 px-4 py-2 text-sm font-medium hover:bg-rose-500"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => void connect()}
              className="rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-sm font-medium text-slate-950 hover:opacity-90"
            >
              Connect
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <IconBadge color="cyan">
              <Wifi size={18} />
            </IconBadge>
            <div className="min-w-0">
              <div className="text-xs text-slate-400">Connection</div>
              <div className="truncate text-sm font-semibold">
                {connected ? 'WiFi · 192.168.4.1' : 'Not connected'}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <IconBadge color="blue">
              <Car size={18} />
            </IconBadge>
            <div className="min-w-0">
              <div className="text-xs text-slate-400">Car Type</div>
              <div className="truncate text-sm font-semibold">{profile.name}</div>
              <div className="text-xs text-slate-500">{labelDrive(profile.drive.kind)}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <IconBadge color="violet">
              <Gamepad2 size={18} />
            </IconBadge>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-400">Command Mode</div>
              <div className="relative">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full appearance-none bg-transparent text-sm font-semibold focus:outline-none"
                >
                  <option value="manual">Manual Control</option>
                  <option value="voice" disabled>
                    Voice (soon)
                  </option>
                  <option value="auto" disabled>
                    Autonomous (soon)
                  </option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-0 top-1 text-slate-500" />
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <IconBadge color="fuchsia">
              <Mic size={18} />
            </IconBadge>
            <div className="min-w-0">
              <div className="text-xs text-slate-400">Voice Assistant</div>
              <div className="text-sm font-semibold text-slate-500">Coming soon</div>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Live Control"
        subtitle="Mock car · hold the joystick to drive"
        right={
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE
          </span>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex justify-center gap-4">
            <Gauge value={speed} max={maxSpeed} label="Speed" unit="m/s" color="#22d3ee" />
            <Gauge value={battPct} max={100} label="Battery" unit={`${battV.toFixed(1)} V`} color="#34d399" />
          </div>
          <div className="grid min-h-[180px] place-items-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 text-center">
            <div className="text-sm text-slate-500">
              <Car size={40} className="mx-auto mb-2 opacity-40" />
              3D car view — next milestone
              {dist != null && (
                <div className="mt-1 text-xs text-cyan-400">obstacle ahead: {dist.toFixed(0)} cm</div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Joystick onChange={drive} disabled={!connected} size={180} />
            <div className="grid grid-cols-4 gap-2">
              <ActionBtn label="Light" active={headlight} disabled={!connected} onClick={toggleHeadlight}>
                <Lightbulb size={16} />
              </ActionBtn>
              <ActionBtn label="Horn" disabled={!connected} onClick={() => action('horn')}>
                <Volume2 size={16} />
              </ActionBtn>
              <ActionBtn label="Measure" disabled={!connected} onClick={() => action('measure')}>
                <Ruler size={16} />
              </ActionBtn>
              <ActionBtn label="E-Stop" danger disabled={!connected} onClick={() => estop()}>
                <Power size={16} />
              </ActionBtn>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Telemetry (Live)" className="lg:col-span-2">
          {history.length > 1 ? (
            <LiveChart series={series} />
          ) : (
            <Empty label="Connect to stream telemetry" />
          )}
        </Card>
        <Card title="Sensor Readings">
          {connected ? <SensorReadings profile={profile} telemetry={telemetry} /> : <Empty label="—" />}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SysInfo icon={<Cpu size={16} />} label="MCU" value={manifest?.board ?? profile.board} />
        <SysInfo icon={<Power size={16} />} label="Firmware" value={manifest?.fw ?? '—'} />
        <SysInfo icon={<Signal size={16} />} label="Drive" value={manifest?.drive ?? profile.drive.kind} />
        <SysInfo
          icon={<Wifi size={16} />}
          label="Transports"
          value={(manifest?.transports ?? profile.transports).join(', ')}
        />
      </div>
    </div>
  );
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function labelDrive(k: string) {
  return k === 'diff4wd' ? '4 Wheel Drive' : k === 'diff2wd' ? '2 Wheel Drive' : k;
}

function IconBadge({ children, color }: { children: ReactNode; color: 'cyan' | 'blue' | 'violet' | 'fuchsia' }) {
  const map = {
    cyan: 'bg-cyan-500/15 text-cyan-300',
    blue: 'bg-blue-500/15 text-blue-300',
    violet: 'bg-violet-500/15 text-violet-300',
    fuchsia: 'bg-fuchsia-500/15 text-fuchsia-300',
  };
  return <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${map[color]}`}>{children}</div>;
}

function ActionBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
  active,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[10px] transition-colors disabled:opacity-40 ${
        danger
          ? 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
          : active
            ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
            : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {children}
      {label}
    </button>
  );
}

function SysInfo({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="grid h-24 place-items-center text-sm text-slate-600">{label}</div>;
}
