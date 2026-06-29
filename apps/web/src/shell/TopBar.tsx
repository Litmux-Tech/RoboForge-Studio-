import { Play, Square, Wifi, Cpu } from 'lucide-react';
import { useRobot } from '../store';

export function TopBar() {
  const { profile, connection, mode, wsHost, setMode, setWsHost, connect, disconnect } = useRobot();
  const connected = connection === 'connected';
  const connecting = connection === 'connecting';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/40 px-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-100">{profile.name}</span>
        <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400">
          Live Control
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
          {(['sim', 'wifi'] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={connected || connecting}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors disabled:opacity-50 ${
                mode === m ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'sim' ? <Cpu size={12} /> : <Wifi size={12} />}
              {m === 'sim' ? 'Sim' : 'WiFi'}
            </button>
          ))}
        </div>

        {mode === 'wifi' && !connected && (
          <input
            aria-label="robot IP address"
            value={wsHost}
            onChange={(e) => setWsHost(e.target.value)}
            disabled={connecting}
            placeholder="192.168.4.1"
            className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
        )}

        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
            connected
              ? 'bg-emerald-500/15 text-emerald-300'
              : connecting
                ? 'bg-amber-500/15 text-amber-300'
                : 'bg-slate-700/40 text-slate-300'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? 'animate-pulse bg-emerald-400' : connecting ? 'animate-pulse bg-amber-400' : 'bg-slate-500'
            }`}
          />
          {connected ? (mode === 'wifi' ? `WiFi · ${wsHost}` : 'Simulator') : connection}
        </span>

        {connected ? (
          <button
            type="button"
            onClick={() => void disconnect()}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-300 hover:bg-rose-500/20"
          >
            <Square size={14} /> Stop
          </button>
        ) : (
          <button
            type="button"
            disabled={connecting}
            onClick={() => void connect()}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-1.5 text-sm font-medium text-slate-950 hover:opacity-90 disabled:opacity-60"
          >
            <Play size={14} /> {connecting ? 'Connecting…' : 'Connect'}
          </button>
        )}

        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-semibold">
          RF
        </div>
      </div>
    </header>
  );
}
