import { Play, Square, Wifi } from 'lucide-react';
import { useRobot } from '../store';

export function TopBar() {
  const { profile, connection, connect, disconnect } = useRobot();
  const connected = connection === 'connected';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/40 px-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-100">{profile.name}</span>
        <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400">
          Live Control
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
            connected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/40 text-slate-300'
          }`}
        >
          <Wifi size={13} /> {connected ? 'WiFi · 192.168.4.1' : connection}
        </span>
        {connected ? (
          <button
            onClick={() => void disconnect()}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-300 hover:bg-rose-500/20"
          >
            <Square size={14} /> Stop
          </button>
        ) : (
          <button
            onClick={() => void connect()}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-1.5 text-sm font-medium text-slate-950 hover:opacity-90"
          >
            <Play size={14} /> Connect
          </button>
        )}
        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-semibold">
          RF
        </div>
      </div>
    </header>
  );
}
