import type { ComponentProps } from 'react';
import { useRobot } from './store';

export default function App() {
  const { profile, connection, manifest, telemetry, connect, disconnect, drive, estop } =
    useRobot();
  const connected = connection === 'connected';

  const distRaw = telemetry?.s['dist_front'];
  const dist = typeof distRaw === 'number' ? distRaw.toFixed(1) : '—';
  const imuRaw = telemetry?.s['imu'];
  const yaw =
    imuRaw && typeof imuRaw === 'object' ? ((imuRaw.yaw ?? 0) * (180 / Math.PI)).toFixed(0) : '—';
  const batt = telemetry?.batt != null ? telemetry.batt.toFixed(2) : '—';
  const uptime = telemetry ? (telemetry.ts / 1000).toFixed(0) : '—';

  const hold = (thr: number, str: number) => ({
    onPointerDown: () => drive(thr, str),
    onPointerUp: () => drive(0, 0),
    onPointerLeave: () => drive(0, 0),
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500 font-bold text-slate-950">
            RF
          </div>
          <div>
            <div className="font-semibold leading-tight">RoboForge Studio</div>
            <div className="text-xs text-slate-400">Walking skeleton · mock transport</div>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            connected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/40 text-slate-300'
          }`}
        >
          {connection}
        </span>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">Robot</div>
              <div className="text-lg font-semibold">{profile.name}</div>
              <div className="text-xs text-slate-500">
                {manifest
                  ? `${manifest.board} · fw ${manifest.fw} · drive ${manifest.drive}`
                  : `${profile.board} · ${profile.drive.kind}`}
              </div>
            </div>
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
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
              >
                Connect
              </button>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Front distance" value={dist} unit="cm" />
          <StatTile label="Heading" value={yaw} unit="°" />
          <StatTile label="Battery" value={batt} unit="V" />
          <StatTile label="Uptime" value={uptime} unit="s" />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Manual control
            </h2>
            <button
              onClick={() => estop()}
              className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 py-1.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/20"
            >
              ■ E-STOP
            </button>
          </div>
          <div className="mx-auto grid w-44 grid-cols-3 gap-2">
            <span />
            <PadButton label="▲" disabled={!connected} {...hold(0.6, 0)} />
            <span />
            <PadButton label="◀" disabled={!connected} {...hold(0, -0.8)} />
            <PadButton label="■" disabled={!connected} onPointerDown={() => drive(0, 0)} />
            <PadButton label="▶" disabled={!connected} {...hold(0, 0.8)} />
            <span />
            <PadButton label="▼" disabled={!connected} {...hold(-0.6, 0)} />
            <span />
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            Hold to drive — releasing stops. SafetyGuard re-sends a heartbeat and cuts the motors on
            disconnect.
          </p>
        </section>
      </main>
    </div>
  );
}

function StatTile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-base font-normal text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

function PadButton({
  label,
  ...rest
}: { label: string } & ComponentProps<'button'>) {
  return (
    <button
      className="grid aspect-square place-items-center rounded-xl border border-slate-700 bg-slate-800 text-xl font-bold text-slate-100 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 disabled:opacity-40"
      {...rest}
    >
      {label}
    </button>
  );
}
