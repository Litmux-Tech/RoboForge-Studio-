import { useEffect, useRef, useState } from 'react';
import { Trash2, ChevronRight } from 'lucide-react';
import { useRobot } from '../store';

const COLOR: Record<string, string> = {
  sys: 'text-slate-400',
  rx: 'text-emerald-300',
  tx: 'text-amber-300',
  err: 'text-rose-400',
};
const TAG: Record<string, string> = { sys: 'SYS', rx: 'RX', tx: 'TX', err: 'ERR' };

export function Terminal() {
  const { log, clearLog, runCommand, connection } = useRobot();
  const [cmd, setCmd] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const connected = connection === 'connected';

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [log.length]);

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Terminal</h1>
          <p className="text-xs text-slate-500">Live serial / protocol monitor</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
              connected ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/40 text-slate-300'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'}`} />
            {connection}
          </span>
          <button
            type="button"
            onClick={() => clearLog()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-relaxed">
        {log.length === 0 ? (
          <div className="grid h-full place-items-center text-slate-600">
            No output yet — press Connect to start the stream.
          </div>
        ) : (
          log.map((l, i) => (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 text-slate-600">{fmt(l.t)}</span>
              <span className={`shrink-0 ${COLOR[l.level]}`}>[{TAG[l.level]}]</span>
              <span className="break-all text-slate-300">{l.msg}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runCommand(cmd);
          setCmd('');
        }}
        className="mt-3 flex shrink-0 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2"
      >
        <ChevronRight size={16} className="text-cyan-400" />
        <input
          aria-label="terminal command"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="type a command…  (try: help, stop, clear)"
          className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
        />
        <button type="submit" className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">
          Send
        </button>
      </form>
    </div>
  );
}

function fmt(t: number) {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}
