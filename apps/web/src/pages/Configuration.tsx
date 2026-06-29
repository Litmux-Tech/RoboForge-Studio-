import { useState } from 'react';
import type { ReactNode } from 'react';
import type { PinId, TransportKind } from '@roboforge/core';
import { useRobot } from '../store';
import { Card } from '../components/Card';

const BOARDS = ['esp32', 'esp8266', 'arduino-uno', 'pi-pico', 'stm32'];
const DRIVES = ['diff2wd', 'diff4wd', 'ackermann', 'mecanum', 'tank', 'omni'];
const CHIPS = ['l298n', 'tb6612', 'bts7960', 'drv8833'];

const TLABEL: Record<TransportKind, string> = {
  sim: 'Simulator',
  'wifi-ws': 'WiFi (WebSocket)',
  ble: 'Bluetooth LE',
  'bt-classic': 'Bluetooth Classic',
  'usb-serial': 'USB Serial',
  'esp-now': 'ESP-NOW',
  mqtt: 'MQTT',
};

export function Configuration() {
  const { profile } = useRobot();
  const [board, setBoard] = useState<string>(profile.board);
  const [kind, setKind] = useState<string>(profile.drive.kind);
  const [chip, setChip] = useState<string>(profile.drive.driverChip);
  const [geo, setGeo] = useState({
    wheelRadius: profile.drive.wheelRadius ?? 0,
    wheelBase: profile.drive.wheelBase ?? 0,
    trackWidth: profile.drive.trackWidth ?? 0,
    maxSpeed: profile.drive.maxSpeed ?? 0,
  });

  type Use = { owner: string; role: string; kind: 'motor' | 'sensor' };
  const byPin = new Map<string, Use[]>();
  const add = (pin: PinId, u: Use) => {
    const k = String(pin);
    const arr = byPin.get(k) ?? [];
    arr.push(u);
    byPin.set(k, arr);
  };
  profile.drive.motors.forEach((m) =>
    Object.entries(m.pins).forEach(([role, pin]) => add(pin, { owner: m.id, role, kind: 'motor' })),
  );
  profile.sensors.forEach((s) =>
    Object.entries(s.pins).forEach(([role, pin]) => add(pin, { owner: s.id, role, kind: 'sensor' })),
  );
  const pins = [...byPin.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-3">
        <h1 className="text-lg font-semibold">Configuration</h1>
        <p className="text-xs text-slate-500">Board, drive geometry, pin map &amp; communication</p>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card title="BOARD">
          <Row label="Controller">
            <Select label="Controller" value={board} onChange={setBoard} options={BOARDS} />
          </Row>
          <Row label="Drive type">
            <Select label="Drive type" value={kind} onChange={setKind} options={DRIVES} />
          </Row>
          <Row label="Motor driver">
            <Select label="Motor driver" value={chip} onChange={setChip} options={CHIPS} />
          </Row>
        </Card>

        <Card title="DRIVE GEOMETRY">
          <Row label="Wheel radius (m)">
            <Num label="Wheel radius" value={geo.wheelRadius} step={0.001} onChange={(v) => setGeo({ ...geo, wheelRadius: v })} />
          </Row>
          <Row label="Wheelbase (m)">
            <Num label="Wheelbase" value={geo.wheelBase} step={0.01} onChange={(v) => setGeo({ ...geo, wheelBase: v })} />
          </Row>
          <Row label="Track width (m)">
            <Num label="Track width" value={geo.trackWidth} step={0.01} onChange={(v) => setGeo({ ...geo, trackWidth: v })} />
          </Row>
          <Row label="Max speed (m/s)">
            <Num label="Max speed" value={geo.maxSpeed} step={0.1} onChange={(v) => setGeo({ ...geo, maxSpeed: v })} />
          </Row>
        </Card>

        <Card title="PIN MAP" className="xl:col-span-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pins.map(([pin, uses]) => (
              <div key={pin} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2">
                <span className="grid h-7 w-12 shrink-0 place-items-center rounded bg-slate-800 font-mono text-xs text-slate-300">
                  {Number.isNaN(Number(pin)) ? pin : `IO${pin}`}
                </span>
                <div className="flex min-w-0 flex-wrap gap-1">
                  {uses.map((u, i) => (
                    <span
                      key={i}
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        u.kind === 'motor' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'
                      }`}
                    >
                      {u.owner}.{u.role}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {pins.length} GPIO assignments · each side's two motors share one L298N channel.
          </p>
        </Card>

        <Card title="COMMUNICATION" className="xl:col-span-2">
          <div className="flex flex-wrap gap-2">
            {profile.transports.map((t) => (
              <span
                key={t}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  t === 'sim'
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400'
                }`}
              >
                {TLABEL[t]}
                {t === 'sim' && ' · active'}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-3 flex justify-end">
        <button type="button" className="rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-cyan-500/20">
          Save Configuration
        </button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-400">{label}</span>
      {children}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Num({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      aria-label={label}
      value={value}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-right text-sm tabular-nums text-slate-200 focus:border-cyan-500 focus:outline-none"
    />
  );
}
