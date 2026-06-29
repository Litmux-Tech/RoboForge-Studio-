import { useRef, useState } from 'react';
import { Usb, Cpu, Upload, Zap, Trash2, AlertTriangle } from 'lucide-react';
import { ESPLoader, Transport } from 'esptool-js';
import { Card } from '../components/Card';

export function Flash() {
  const supported = typeof navigator !== 'undefined' && 'serial' in navigator;
  const [log, setLog] = useState<string[]>([]);
  const [chip, setChip] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [offset, setOffset] = useState('0x0');
  const [file, setFile] = useState<File | null>(null);
  const loaderRef = useRef<ESPLoader | null>(null);
  const transportRef = useRef<Transport | null>(null);

  const append = (s: string) => setLog((l) => [...l, s].slice(-400));
  const terminal = {
    clean: () => setLog([]),
    writeLine: (d: string) => append(d),
    write: (d: string) => append(d),
  };

  const connect = async () => {
    try {
      setBusy(true);
      // Web Serial typings vary by browser; access via any to stay portable.
      const port = await (navigator as unknown as { serial: { requestPort(): Promise<unknown> } }).serial.requestPort();
      const transport = new Transport(port as never, true);
      transportRef.current = transport;
      const loader = new ESPLoader({ transport, baudrate: 115200, terminal });
      loaderRef.current = loader;
      const c = await loader.main();
      setChip(typeof c === 'string' ? c : 'ESP device');
      append(`Connected · ${c}`);
    } catch (e) {
      append(`Error: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    try {
      await transportRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    transportRef.current = null;
    loaderRef.current = null;
    setChip(null);
    setProgress(null);
    append('Disconnected');
  };

  const flash = async () => {
    const loader = loaderRef.current;
    if (!loader || !file) return;
    try {
      setBusy(true);
      setProgress(0);
      const data = new Uint8Array(await file.arrayBuffer());
      const address = parseInt(offset, 16) || 0;
      append(`Writing ${file.name} (${(file.size / 1024).toFixed(0)} KB) @ ${offset}…`);
      await loader.writeFlash({
        fileArray: [{ data, address }],
        flashSize: 'keep',
        flashMode: 'keep',
        flashFreq: 'keep',
        eraseAll: false,
        compress: true,
        reportProgress: (_i, written, total) => setProgress(Math.round((written / total) * 100)),
      });
      append('✓ Flash complete. Press the board’s RESET/EN button to run it.');
    } catch (e) {
      append(`Flash error: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const erase = async () => {
    const loader = loaderRef.current;
    if (!loader) return;
    try {
      setBusy(true);
      append('Erasing flash…');
      await loader.eraseFlash();
      append('✓ Flash erased.');
    } catch (e) {
      append(`Erase error: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-3">
        <h1 className="text-lg font-semibold">Firmware Flashing</h1>
        <p className="text-xs text-slate-500">Flash the ESP32 over USB — straight from the browser (Web Serial)</p>
      </div>

      {!supported ? (
        <Card>
          <div className="flex items-center gap-2 text-sm text-amber-300">
            <AlertTriangle size={16} /> Web Serial isn&apos;t available here. Use Chrome or Edge on desktop.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-3">
            <Card title="DEVICE">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-500/15 text-cyan-300">
                    <Cpu size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{chip ?? 'No device connected'}</div>
                    <div className="text-xs text-slate-500">{chip ? 'Connected over USB serial' : 'Plug in your ESP32 and connect'}</div>
                  </div>
                </div>
                {chip ? (
                  <button type="button" onClick={disconnect} disabled={busy} className="shrink-0 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300 disabled:opacity-50">
                    Disconnect
                  </button>
                ) : (
                  <button type="button" onClick={connect} disabled={busy} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-1.5 text-sm font-medium text-slate-950 disabled:opacity-60">
                    <Usb size={15} /> Connect Device
                  </button>
                )}
              </div>
            </Card>

            <Card title="FIRMWARE">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-700 p-3 hover:border-slate-600">
                <Upload size={18} className="text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{file ? file.name : 'Choose a firmware .bin'}</div>
                  <div className="text-xs text-slate-500">
                    {file ? `${(file.size / 1024).toFixed(0)} KB` : 'Build roverlib with PlatformIO, then pick the merged .bin'}
                  </div>
                </div>
                <input type="file" accept=".bin" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label htmlFor="rf-offset" className="text-xs text-slate-400">Flash offset</label>
                <input
                  id="rf-offset"
                  aria-label="flash offset"
                  value={offset}
                  onChange={(e) => setOffset(e.target.value)}
                  className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm tabular-nums text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500">0x0 for a merged/factory bin · 0x10000 for app-only</span>
              </div>

              <div className="mt-3 flex gap-2">
                <button type="button" onClick={flash} disabled={busy || !chip || !file} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50">
                  <Zap size={15} /> Flash
                </button>
                <button type="button" onClick={erase} disabled={busy || !chip} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50">
                  <Trash2 size={14} /> Erase Flash
                </button>
              </div>

              {progress !== null && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>Flashing…</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </Card>
          </div>

          <Card title="CONSOLE">
            <div className="h-[60vh] overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
              {log.length === 0 ? (
                <div className="text-slate-600">Connect a device to begin…</div>
              ) : (
                log.map((l, i) => (
                  <div key={i} className="whitespace-pre-wrap break-all">
                    {l}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
