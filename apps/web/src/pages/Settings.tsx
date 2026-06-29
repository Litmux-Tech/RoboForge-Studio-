import { useState } from 'react';
import type { ReactNode } from 'react';
import { Palette, Ruler, Globe, Radio, Gauge, Shield, Save, Info } from 'lucide-react';
import { Card } from '../components/Card';

export function Settings() {
  const [theme, setTheme] = useState('dark');
  const [units, setUnits] = useState('metric');
  const [lang, setLang] = useState('English');
  const [comm, setComm] = useState('wifi');
  const [rate, setRate] = useState('10');
  const [timeoutMs, setTimeoutMs] = useState('400');
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-3">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-xs text-slate-500">Preferences for the workspace</p>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card title="APPEARANCE">
          <Field icon={<Palette size={14} />} label="Theme">
            <Segmented value={theme} onChange={setTheme} options={['dark', 'light', 'system']} />
          </Field>
          <Field icon={<Globe size={14} />} label="Language">
            <Select label="Language" value={lang} onChange={setLang} options={['English', 'Français', 'Español', '中文']} />
          </Field>
          <Field icon={<Ruler size={14} />} label="Units">
            <Segmented value={units} onChange={setUnits} options={['metric', 'imperial']} />
          </Field>
        </Card>

        <Card title="CONNECTION & SIM">
          <Field icon={<Radio size={14} />} label="Default link">
            <Select label="Default link" value={comm} onChange={setComm} options={['wifi', 'ble', 'usb-serial']} />
          </Field>
          <Field icon={<Gauge size={14} />} label="Telemetry rate">
            <Select label="Telemetry rate" value={rate} onChange={setRate} options={['5', '10', '20']} suffix="Hz" />
          </Field>
          <Field icon={<Shield size={14} />} label="Safety timeout">
            <Select label="Safety timeout" value={timeoutMs} onChange={setTimeoutMs} options={['200', '300', '400', '600']} suffix="ms" />
          </Field>
          <Field icon={<Save size={14} />} label="Auto-save">
            <Toggle on={autoSave} onChange={() => setAutoSave((v) => !v)} label="Auto-save" />
          </Field>
        </Card>

        <Card title="ABOUT" className="xl:col-span-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Info size={15} className="text-cyan-400" /> RoboForge Studio
            </div>
            <span className="text-xs text-slate-500">v1.0.0-alpha · MIT · open source</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-slate-300">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
            value === o ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
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
      {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onChange}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}
