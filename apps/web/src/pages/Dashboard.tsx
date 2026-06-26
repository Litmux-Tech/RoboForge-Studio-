import { useState } from 'react';
import type { ReactNode } from 'react';
import { Lightbulb, Volume2, Ruler, Power, Boxes } from 'lucide-react';
import { SimTransport } from '@roboforge/sim';
import { useRobot } from '../store';
import { Card } from '../components/Card';
import { Gauge } from '../components/Gauge';
import { Joystick } from '../components/Joystick';
import { LiveChart } from '../components/LiveChart';
import { SensorReadings } from '../components/SensorReadings';
import { SimScene } from '../sim/SimScene';

export function Dashboard() {
  const { profile, connection, manifest, telemetry, history, transport, drive, estop, action } =
    useRobot();
  const connected = connection === 'connected';
  const sim = transport instanceof SimTransport ? transport : null;
  const [headlight, setHeadlight] = useState(false);

  const maxSpeed = profile.drive.maxSpeed ?? 1.5;
  const speed = Math.abs(telemetry?.spd ?? 0);
  const battV = telemetry?.batt ?? 0;
  const battPct = Math.round(clamp01((battV - 6) / (8.4 - 6)) * 100);
  const distRaw = telemetry?.s['dist_front'];
  const dist = typeof distRaw === 'number' ? distRaw : null;
  const uptime = telemetry ? fmtTime(telemetry.ts) : '00:00';

  const series = [
    { name: 'Speed (m/s)', color: '#22d3ee', data: history.map((h) => h.spd) },
    { name: 'Battery (V)', color: '#34d399', data: history.map((h) => h.batt) },
    { name: 'Distance (cm)', color: '#a78bfa', data: history.map((h) => h.dist) },
  ];

  const toggleLight = () => {
    const next = !headlight;
    setHeadlight(next);
    action(next ? 'light_on' : 'light_off');
  };

  return (
    <div className="grid h-full grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[1fr_340px]">
      {/* LEFT — 3D hero + control bar */}
      <div className="flex min-h-0 flex-col gap-3">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <SimScene profile={profile} sim={sim} />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <span className="flex items-center gap-1.5 rounded-md bg-black/40 px-2 py-1 text-xs backdrop-blur">
              <span
                className={`h-1.5 w-1.5 rounded-full ${connected ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'}`}
              />
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
            {dist != null && (
              <span
                className={`rounded-md px-2 py-1 text-xs backdrop-blur ${
                  dist < 25 ? 'bg-rose-500/30 text-rose-200' : 'bg-black/40 text-cyan-300'
                }`}
              >
                ◢ {dist.toFixed(0)} cm
              </span>
            )}
          </div>

          {!connected && (
            <div className="absolute inset-0 grid place-items-center bg-slate-950/40 backdrop-blur-[2px]">
              <div className="text-center text-sm text-slate-400">
                <Boxes size={36} className="mx-auto mb-2 opacity-50" />
                Press <span className="font-medium text-cyan-300">Connect</span> (top right) to start
                the simulation
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
          <Joystick onChange={drive} disabled={!connected} size={130} />
          <div className="flex gap-3">
            <Gauge value={speed} max={maxSpeed} label="Speed" unit="m/s" size={92} />
            <Gauge value={battPct} max={100} label="Battery" unit={`${battV.toFixed(1)} V`} color="#34d399" size={92} />
          </div>
          <div className="ml-auto grid grid-cols-2 gap-2">
            <ActionBtn label="Light" active={headlight} disabled={!connected} onClick={toggleLight}>
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

      {/* RIGHT — status + sensors + telemetry */}
      <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
        <Card title="Connection Status">
          <div className="space-y-1.5">
            <Row label="Board" value={manifest?.board ?? profile.board} />
            <Row label="Address" value={connected ? '192.168.4.1' : '—'} />
            <Row label="Protocol" value={connected ? 'Sim · kinematic' : '—'} />
            <Row label="Firmware" value={manifest?.fw ?? '—'} />
            <Row label="Uptime" value={uptime} />
          </div>
        </Card>

        <Card title="Sensor Readings">
          {connected ? (
            <SensorReadings profile={profile} telemetry={telemetry} />
          ) : (
            <div className="py-3 text-sm text-slate-600">—</div>
          )}
        </Card>

        <Card title="Telemetry (Live)" className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            {history.length > 1 ? (
              <LiveChart series={series} />
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-600">
                Connect to stream telemetry
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium tabular-nums text-slate-100">{value}</span>
    </div>
  );
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
      className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 text-[10px] transition-colors disabled:opacity-40 ${
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
