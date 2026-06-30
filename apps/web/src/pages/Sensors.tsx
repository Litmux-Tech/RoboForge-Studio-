import { useState } from 'react';
import { Plus, Radar, Compass, Thermometer, Zap, ScanLine, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SensorDriver } from '@roboforge/core';
import { useRobot } from '../store';
import { Card } from '../components/Card';

const META: Record<SensorDriver, { label: string; unit: string; icon: LucideIcon }> = {
  hcsr04: { label: 'Ultrasonic (HC-SR04)', unit: 'cm', icon: Radar },
  vl53l0x: { label: 'ToF Distance (VL53L0X)', unit: 'cm', icon: Radar },
  mpu6050: { label: 'IMU (MPU6050)', unit: '', icon: Compass },
  dht22: { label: 'Temp / Humidity (DHT22)', unit: '°C', icon: Thermometer },
  ina219: { label: 'Voltage / Current (INA219)', unit: 'V', icon: Zap },
  'ir-line': { label: 'IR Line Sensor', unit: '', icon: ScanLine },
  'gps-neo6m': { label: 'GPS (NEO-6M)', unit: '', icon: MapPin },
};

export function Sensors() {
  const { profile, telemetry, connection } = useRobot();
  const connected = connection === 'connected';
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(profile.sensors.map((s) => [s.id, true])),
  );

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Sensors</h1>
          <p className="text-xs text-slate-500">Add and configure the robot's sensors</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
        >
          <Plus size={15} /> Add Sensor
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {profile.sensors.map((s) => {
          const meta = META[s.driver];
          const Icon = meta.icon;
          const v = telemetry?.s[s.id];
          let display = '—';
          if (typeof v === 'number') display = `${v.toFixed(1)} ${meta.unit}`.trim();
          else if (v && typeof v === 'object')
            display = Object.entries(v)
              .map(([k, val]) => `${k} ${val.toFixed(2)}`)
              .join('  ');
          const on = enabled[s.id];

          return (
            <Card key={s.id}>
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-500/15 text-cyan-300">
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{s.label ?? s.id}</div>
                    <button
                      type="button"
                      aria-label={`toggle ${s.id}`}
                      onClick={() => setEnabled((e) => ({ ...e, [s.id]: !on }))}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-700'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">{meta.label}</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(s.pins).map(([role, pin]) => (
                  <span key={role} className="rounded border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {role}: <span className="text-slate-200">{pin}</span>
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2">
                <span className="text-xs text-slate-500">Live</span>
                <span className="font-mono text-sm tabular-nums text-cyan-300">{connected && on ? display : '—'}</span>
              </div>
            </Card>
          );
        })}

        <button
          type="button"
          className="flex min-h-[120px] items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 text-sm text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-400"
        >
          <Plus size={16} /> Add a sensor
        </button>
      </div>
    </div>
  );
}
