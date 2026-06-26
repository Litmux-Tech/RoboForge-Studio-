import { useRobot } from '../store';

export function StatusBar() {
  const { connection } = useRobot();
  const connected = connection === 'connected';

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-slate-800 bg-slate-900/40 px-4 text-xs text-slate-500">
      <div className="flex items-center gap-4">
        <span>Sim · kinematic</span>
        <span>Physics 20 Hz</span>
      </div>
      <div className="flex items-center gap-4">
        <span>v1.0.0-alpha</span>
        <span className={`flex items-center gap-1.5 ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          {connected ? 'All systems normal' : 'Idle'}
        </span>
      </div>
    </footer>
  );
}
