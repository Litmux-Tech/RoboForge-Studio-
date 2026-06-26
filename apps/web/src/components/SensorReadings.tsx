import type { RobotProfile, TelemetryMsg } from '@roboforge/core';

function unitFor(driver: string): string {
  if (driver === 'hcsr04' || driver === 'vl53l0x') return 'cm';
  if (driver === 'dht22') return '°C';
  if (driver === 'ina219') return 'V';
  return '';
}

export function SensorReadings({
  profile,
  telemetry,
}: {
  profile: RobotProfile;
  telemetry: TelemetryMsg | null;
}) {
  return (
    <ul className="space-y-2.5">
      {profile.sensors.map((s) => {
        const v = telemetry?.s[s.id];
        let display = '—';
        if (typeof v === 'number') {
          display = v.toFixed(1);
        } else if (v && typeof v === 'object') {
          display = Object.entries(v)
            .map(([k, val]) => `${k} ${val.toFixed(2)}`)
            .join('  ');
        }
        return (
          <li key={s.id} className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{s.label ?? s.id}</span>
            <span className="font-medium tabular-nums text-slate-100">
              {display} <span className="text-xs text-slate-500">{unitFor(s.driver)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
