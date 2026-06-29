import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Gamepad2,
  Activity,
  Radar,
  SlidersHorizontal,
  TerminalSquare,
  Settings,
  Usb,
  Workflow,
  Cpu,
  Battery,
} from 'lucide-react';
import { useRobot } from '../store';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/control', label: 'Control', icon: Gamepad2 },
  { to: '/telemetry', label: 'Telemetry', icon: Activity },
  { to: '/sensors', label: 'Sensors', icon: Radar },
  { to: '/configuration', label: 'Configuration', icon: SlidersHorizontal },
  { to: '/circuit', label: 'Circuit', icon: Workflow },
  { to: '/flash', label: 'Flash', icon: Usb },
  { to: '/terminal', label: 'Terminal', icon: TerminalSquare },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { profile, connection, telemetry } = useRobot();
  const online = connection === 'connected';
  const battPct =
    telemetry?.batt != null ? Math.round(clamp01((telemetry.batt - 6.0) / (8.4 - 6.0)) * 100) : 0;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900/40">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-slate-950">
          RF
        </div>
        <div>
          <div className="text-sm font-bold leading-tight tracking-wide">ROBOFORGE</div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Studio</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Cpu size={14} /> {profile.board}
          </span>
          <span className={`flex items-center gap-1 text-xs ${online ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Battery size={14} />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${battPct}%` }} />
          </div>
          <span className="tabular-nums">{battPct}%</span>
        </div>
      </div>
    </aside>
  );
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
