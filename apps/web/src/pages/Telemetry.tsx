import { useRobot } from '../store';
import { Card } from '../components/Card';
import { LiveChart } from '../components/LiveChart';

export function Telemetry() {
  const { history, telemetry, connection } = useRobot();
  const connected = connection === 'connected';
  const last = history.at(-1);

  const imu = telemetry?.s['imu'];
  const yawDeg = (imu && typeof imu === 'object' ? imu.yaw ?? 0 : 0) * (180 / Math.PI);

  const metrics = [
    { name: 'Speed', unit: 'm/s', color: '#22d3ee', cur: Math.abs(telemetry?.spd ?? 0).toFixed(2), data: history.map((h) => h.spd) },
    { name: 'Battery', unit: 'V', color: '#34d399', cur: (telemetry?.batt ?? 0).toFixed(2), data: history.map((h) => h.batt) },
    { name: 'Front Distance', unit: 'cm', color: '#a78bfa', cur: (last?.dist ?? 0).toFixed(0), data: history.map((h) => h.dist) },
    { name: 'Heading', unit: '°', color: '#f59e0b', cur: yawDeg.toFixed(0), data: history.map((h) => h.yaw * (180 / Math.PI)) },
  ];

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-3">
        <h1 className="text-lg font-semibold">Telemetry</h1>
        <p className="text-xs text-slate-500">Real-time sensor &amp; drive data</p>
      </div>

      {!connected && (
        <div className="mb-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-sm text-slate-500">
          Not connected — press Connect (top bar) to stream telemetry.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {metrics.map((m) => (
          <Card key={m.name}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm text-slate-400">{m.name}</span>
              <span className="text-2xl font-bold tabular-nums" style={{ color: m.color }}>
                {m.cur}
                <span className="ml-1 text-sm font-normal text-slate-500">{m.unit}</span>
              </span>
            </div>
            <div className="h-28">
              {history.length > 1 ? (
                <LiveChart series={[{ name: m.name, color: m.color, data: m.data }]} />
              ) : (
                <div className="grid h-full place-items-center text-xs text-slate-600">waiting for data…</div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
