import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  ConnectionMode,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Cpu, Cog, Radar, BatteryFull, CircuitBoard, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import type { TelemetryMsg } from '@roboforge/core';
import { useRobot } from '../store';

type PinType = 'power' | 'gnd' | 'gpio' | 'signal' | 'analog' | 'i2c' | 'motor';
type Kind = 'power' | 'controller' | 'driver' | 'motor' | 'sensor';

interface Pin {
  id: string;
  label: string;
  side: 'l' | 'r';
  type: PinType;
}
interface Spec {
  kind: Kind;
  board: string;
  accent: string;
  width: number;
  pins: Pin[];
}

const PIN_COLOR: Record<PinType, string> = {
  power: '#ef4444',
  gnd: '#64748b',
  gpio: '#22d3ee',
  signal: '#22d3ee',
  analog: '#38bdf8',
  i2c: '#a78bfa',
  motor: '#f59e0b',
};

const SPECS: Record<string, Spec> = {
  esp32: {
    kind: 'controller',
    board: '#0b1f3a',
    accent: '#22d3ee',
    width: 152,
    pins: [
      { id: '3v3', label: '3V3', side: 'l', type: 'power' },
      { id: 'gnd', label: 'GND', side: 'l', type: 'gnd' },
      { id: 'g26', label: 'IO26', side: 'l', type: 'gpio' },
      { id: 'g27', label: 'IO27', side: 'l', type: 'gpio' },
      { id: 'g14', label: 'IO14', side: 'l', type: 'gpio' },
      { id: 'g25', label: 'IO25', side: 'l', type: 'gpio' },
      { id: 'g33', label: 'IO33', side: 'l', type: 'gpio' },
      { id: 'g12', label: 'IO12', side: 'l', type: 'gpio' },
      { id: 'vin', label: 'VIN', side: 'r', type: 'power' },
      { id: 'g5', label: 'IO5', side: 'r', type: 'gpio' },
      { id: 'g18', label: 'IO18', side: 'r', type: 'gpio' },
      { id: 'g21', label: 'IO21 SDA', side: 'r', type: 'i2c' },
      { id: 'g22', label: 'IO22 SCL', side: 'r', type: 'i2c' },
      { id: 'g34', label: 'IO34', side: 'r', type: 'analog' },
    ],
  },
  l298n: {
    kind: 'driver',
    board: '#5b1414',
    accent: '#ef4444',
    width: 150,
    pins: [
      { id: 'in1', label: 'IN1', side: 'l', type: 'signal' },
      { id: 'in2', label: 'IN2', side: 'l', type: 'signal' },
      { id: 'ena', label: 'ENA', side: 'l', type: 'signal' },
      { id: 'in3', label: 'IN3', side: 'l', type: 'signal' },
      { id: 'in4', label: 'IN4', side: 'l', type: 'signal' },
      { id: 'enb', label: 'ENB', side: 'l', type: 'signal' },
      { id: 'v12', label: '+12V', side: 'l', type: 'power' },
      { id: 'gnd', label: 'GND', side: 'l', type: 'gnd' },
      { id: 'out1', label: 'OUT1', side: 'r', type: 'motor' },
      { id: 'out2', label: 'OUT2', side: 'r', type: 'motor' },
      { id: 'out3', label: 'OUT3', side: 'r', type: 'motor' },
      { id: 'out4', label: 'OUT4', side: 'r', type: 'motor' },
    ],
  },
  motor: {
    kind: 'motor',
    board: '#1f2937',
    accent: '#94a3b8',
    width: 112,
    pins: [
      { id: 'p', label: 'M+', side: 'l', type: 'motor' },
      { id: 'n', label: 'M−', side: 'l', type: 'motor' },
    ],
  },
  hcsr04: {
    kind: 'sensor',
    board: '#0c2a4a',
    accent: '#60a5fa',
    width: 132,
    pins: [
      { id: 'vcc', label: 'VCC', side: 'l', type: 'power' },
      { id: 'trig', label: 'TRIG', side: 'l', type: 'signal' },
      { id: 'echo', label: 'ECHO', side: 'l', type: 'signal' },
      { id: 'gnd', label: 'GND', side: 'l', type: 'gnd' },
    ],
  },
  mpu6050: {
    kind: 'sensor',
    board: '#0c2a4a',
    accent: '#a78bfa',
    width: 132,
    pins: [
      { id: 'vcc', label: 'VCC', side: 'l', type: 'power' },
      { id: 'gnd', label: 'GND', side: 'l', type: 'gnd' },
      { id: 'sda', label: 'SDA', side: 'l', type: 'i2c' },
      { id: 'scl', label: 'SCL', side: 'l', type: 'i2c' },
    ],
  },
  battery: {
    kind: 'power',
    board: '#064e3b',
    accent: '#34d399',
    width: 110,
    pins: [
      { id: 'pos', label: '+', side: 'r', type: 'power' },
      { id: 'neg', label: '−', side: 'r', type: 'gnd' },
    ],
  },
};

const HEADER_H = 24;
const ROW_H = 19;

interface NData {
  specKey: string;
  label: string;
  [k: string]: unknown;
}

function liveValue(specKey: string, tel: TelemetryMsg | null): string | null {
  if (!tel) return null;
  if (specKey === 'hcsr04') {
    const v = tel.s['dist_front'];
    return typeof v === 'number' ? `${v.toFixed(0)} cm` : null;
  }
  if (specKey === 'mpu6050') {
    const v = tel.s['imu'];
    return v && typeof v === 'object' ? `${(((v.yaw ?? 0) * 180) / Math.PI).toFixed(0)}°` : null;
  }
  if (specKey === 'battery') {
    return tel.batt != null ? `${tel.batt.toFixed(2)} V` : null;
  }
  return null;
}

function withLive(e: Edge, connected: boolean, moving: boolean): Edge {
  const sig = (e.data as { sig?: PinType } | undefined)?.sig;
  let animated = false;
  if (connected) {
    if (sig === 'power' || sig === 'gnd' || sig === 'i2c') animated = true;
    else if (sig === 'motor' || sig === 'signal') animated = moving;
  }
  return !!e.animated === animated ? e : { ...e, animated };
}

function ComponentNode({ data }: NodeProps) {
  const d = data as unknown as NData;
  const spec = SPECS[d.specKey];
  const connection = useRobot((s) => s.connection);
  const telemetry = useRobot((s) => s.telemetry);
  if (!spec) return null;
  const live = connection === 'connected' ? liveValue(d.specKey, telemetry) : null;
  const left = spec.pins.filter((p) => p.side === 'l');
  const right = spec.pins.filter((p) => p.side === 'r');
  const rows = Math.max(left.length, right.length);
  const height = HEADER_H + rows * ROW_H + 8;

  return (
    <div
      className="relative rounded-md border-2 text-white shadow-xl"
      style={{ width: spec.width, height, background: spec.board, borderColor: spec.accent }}
    >
      <div className="flex items-center justify-between gap-1 px-2 py-1 text-[11px] font-semibold" style={{ borderBottom: `1px solid ${spec.accent}44` }}>
        <span className="truncate">{d.label}</span>
        {live && <span className="shrink-0 rounded bg-black/40 px-1 text-[9px] font-normal text-emerald-300">{live}</span>}
      </div>
      <div className="absolute left-2.5" style={{ top: HEADER_H }}>
        {left.map((p) => (
          <div key={p.id} className="flex items-center text-[9px] text-white/85" style={{ height: ROW_H }}>
            <span className="mr-1 h-1.5 w-1.5 rounded-full" style={{ background: PIN_COLOR[p.type] }} />
            {p.label}
          </div>
        ))}
      </div>
      <div className="absolute right-2.5 text-right" style={{ top: HEADER_H }}>
        {right.map((p) => (
          <div key={p.id} className="flex items-center justify-end text-[9px] text-white/85" style={{ height: ROW_H }}>
            {p.label}
            <span className="ml-1 h-1.5 w-1.5 rounded-full" style={{ background: PIN_COLOR[p.type] }} />
          </div>
        ))}
      </div>
      {left.map((p, i) => (
        <Handle
          key={p.id}
          id={p.id}
          type="source"
          position={Position.Left}
          style={{ top: HEADER_H + i * ROW_H + ROW_H / 2, width: 7, height: 7, background: PIN_COLOR[p.type], border: '1px solid #00000088' }}
        />
      ))}
      {right.map((p, i) => (
        <Handle
          key={p.id}
          id={p.id}
          type="source"
          position={Position.Right}
          style={{ top: HEADER_H + i * ROW_H + ROW_H / 2, width: 7, height: 7, background: PIN_COLOR[p.type], border: '1px solid #00000088' }}
        />
      ))}
    </div>
  );
}

const nodeTypes: NodeTypes = { component: ComponentNode };

const PALETTE: { specKey: string; label: string; icon: typeof Cpu }[] = [
  { specKey: 'esp32', label: 'ESP32', icon: Cpu },
  { specKey: 'l298n', label: 'L298N', icon: Cog },
  { specKey: 'motor', label: 'DC Motor', icon: CircuitBoard },
  { specKey: 'hcsr04', label: 'Ultrasonic', icon: Radar },
  { specKey: 'mpu6050', label: 'IMU', icon: Radar },
  { specKey: 'battery', label: 'Battery', icon: BatteryFull },
];

function mkNode(id: string, specKey: string, label: string, x: number, y: number): Node {
  return { id, type: 'component', position: { x, y }, data: { specKey, label } };
}
function mkEdge(s: string, sh: string, t: string, th: string, type: PinType): Edge {
  return {
    id: `${s}.${sh}-${t}.${th}`,
    source: s,
    target: t,
    sourceHandle: sh,
    targetHandle: th,
    type: 'smoothstep',
    data: { sig: type },
    style: { stroke: PIN_COLOR[type], strokeWidth: 2 },
  };
}

function buildGraph(board: string): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    mkNode('battery', 'battery', 'Li-ion 7.4V', 30, 150),
    mkNode('esp32', 'esp32', `${board.toUpperCase()} DevKit`, 250, 90),
    mkNode('l298n', 'l298n', 'L298N Driver', 520, 70),
    mkNode('hcsr04', 'hcsr04', 'HC-SR04', 250, 360),
    mkNode('mpu6050', 'mpu6050', 'MPU6050 IMU', 250, 480),
    mkNode('m_fl', 'motor', 'Front Left', 800, 20),
    mkNode('m_rl', 'motor', 'Rear Left', 800, 140),
    mkNode('m_fr', 'motor', 'Front Right', 800, 260),
    mkNode('m_rr', 'motor', 'Rear Right', 800, 380),
  ];
  const edges: Edge[] = [
    mkEdge('battery', 'pos', 'esp32', 'vin', 'power'),
    mkEdge('battery', 'neg', 'esp32', 'gnd', 'gnd'),
    mkEdge('battery', 'pos', 'l298n', 'v12', 'power'),
    mkEdge('battery', 'neg', 'l298n', 'gnd', 'gnd'),
    mkEdge('esp32', 'g26', 'l298n', 'in1', 'signal'),
    mkEdge('esp32', 'g27', 'l298n', 'in2', 'signal'),
    mkEdge('esp32', 'g14', 'l298n', 'ena', 'signal'),
    mkEdge('esp32', 'g25', 'l298n', 'in3', 'signal'),
    mkEdge('esp32', 'g33', 'l298n', 'in4', 'signal'),
    mkEdge('esp32', 'g12', 'l298n', 'enb', 'signal'),
    mkEdge('l298n', 'out1', 'm_fl', 'p', 'motor'),
    mkEdge('l298n', 'out2', 'm_fl', 'n', 'motor'),
    mkEdge('l298n', 'out1', 'm_rl', 'p', 'motor'),
    mkEdge('l298n', 'out2', 'm_rl', 'n', 'motor'),
    mkEdge('l298n', 'out3', 'm_fr', 'p', 'motor'),
    mkEdge('l298n', 'out4', 'm_fr', 'n', 'motor'),
    mkEdge('l298n', 'out3', 'm_rr', 'p', 'motor'),
    mkEdge('l298n', 'out4', 'm_rr', 'n', 'motor'),
    mkEdge('esp32', '3v3', 'hcsr04', 'vcc', 'power'),
    mkEdge('esp32', 'g5', 'hcsr04', 'trig', 'signal'),
    mkEdge('esp32', 'g18', 'hcsr04', 'echo', 'signal'),
    mkEdge('esp32', 'gnd', 'hcsr04', 'gnd', 'gnd'),
    mkEdge('esp32', '3v3', 'mpu6050', 'vcc', 'power'),
    mkEdge('esp32', 'gnd', 'mpu6050', 'gnd', 'gnd'),
    mkEdge('esp32', 'g21', 'mpu6050', 'sda', 'i2c'),
    mkEdge('esp32', 'g22', 'mpu6050', 'scl', 'i2c'),
  ];
  return { nodes, edges };
}

interface Report {
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

function kindOf(nodes: Node[], id: string | null | undefined): Kind | undefined {
  if (!id) return undefined;
  const n = nodes.find((x) => x.id === id);
  return n ? SPECS[(n.data as unknown as NData).specKey]?.kind : undefined;
}

function validate(nodes: Node[], edges: Edge[]): Report {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const n of nodes) {
    const d = n.data as unknown as NData;
    const kind = SPECS[d.specKey]?.kind;
    const neighbours = edges
      .filter((e) => e.source === n.id || e.target === n.id)
      .map((e) => (e.source === n.id ? e.target : e.source));

    if (kind === 'motor') {
      const fromDriver = neighbours.some((id) => kindOf(nodes, id) === 'driver');
      const fromController = neighbours.some((id) => kindOf(nodes, id) === 'controller');
      if (fromController && !fromDriver)
        errors.push(`${d.label}: a DC motor can't be driven directly from a GPIO — route it through the L298N driver (a GPIO sources only ~12 mA).`);
      else if (!fromDriver) warnings.push(`${d.label} isn't wired to a motor-driver output.`);
    }
    if (kind === 'driver' && !neighbours.some((id) => kindOf(nodes, id) === 'power')) {
      warnings.push(`${d.label} has no power connection.`);
    }
    if (kind === 'sensor' && neighbours.length === 0) {
      warnings.push(`${d.label} is not wired up.`);
    }
  }

  const suggestions = [
    'Add a voltage divider to IO34 to monitor battery charge.',
    'Add a decoupling capacitor across the motor supply rails.',
  ];
  return { errors, warnings, suggestions };
}

export function CircuitBuilder() {
  const { profile, connection, telemetry } = useRobot();
  const connected = connection === 'connected';
  const moving = connected && Math.abs(telemetry?.spd ?? 0) > 0.02;
  const initial = useMemo(() => buildGraph(profile.board), [profile.board]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [seq, setSeq] = useState(1000);

  const onConnect = useCallback(
    (c: Connection) => {
      const src = nodes.find((n) => n.id === c.source);
      const specKey = src ? (src.data as unknown as NData).specKey : undefined;
      const pin = specKey ? SPECS[specKey]?.pins.find((p) => p.id === c.sourceHandle) : undefined;
      const color = pin ? PIN_COLOR[pin.type] : '#64748b';
      setEdges((eds) => addEdge({ ...c, type: 'smoothstep', style: { stroke: color, strokeWidth: 2 } }, eds));
    },
    [nodes, setEdges],
  );

  const addComponent = (specKey: string, label: string) => {
    const id = `${specKey}_${seq}`;
    setSeq((s) => s + 1);
    setNodes((ns) => ns.concat(mkNode(id, specKey, label, 300, 40 + (seq % 6) * 26)));
  };

  const report = useMemo(() => validate(nodes, edges), [nodes, edges]);
  const clean = report.errors.length === 0 && report.warnings.length === 0;
  const displayEdges = useMemo(() => edges.map((e) => withLive(e, connected, moving)), [edges, connected, moving]);

  return (
    <div className="flex h-full">
      <div className="w-44 shrink-0 overflow-y-auto border-r border-slate-800 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Components</div>
        <div className="space-y-1.5">
          {PALETTE.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => addComponent(p.specKey, p.label)}
              className="flex w-full items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2 text-xs text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800/60"
            >
              <p.icon size={14} className="text-slate-400" />
              <span className="flex-1 text-left">{p.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-1 text-[10px] text-slate-500">
          <Legend color={PIN_COLOR.power} label="Power" />
          <Legend color={PIN_COLOR.gnd} label="Ground" />
          <Legend color={PIN_COLOR.signal} label="Signal / GPIO" />
          <Legend color={PIN_COLOR.i2c} label="I²C" />
          <Legend color={PIN_COLOR.motor} label="Motor" />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-600">Drag a pin to another to wire it. Validation runs live.</p>
      </div>

      <div className="relative min-w-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          colorMode="dark"
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={18} size={1} color="#1e293b" />
          <Controls />
          <MiniMap pannable zoomable className="!bg-slate-900" />
          {connected && (
            <Panel position="top-left">
              <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-1 text-[11px] text-emerald-300 backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE · mirroring the {moving ? 'driving' : 'idle'} robot
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      <div className="w-80 shrink-0 overflow-y-auto border-l border-slate-800 p-3">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Wiring Validation</div>
        <div className="mb-3 flex gap-3 text-xs">
          <span className={report.errors.length ? 'text-rose-400' : 'text-emerald-400'}>{report.errors.length} errors</span>
          <span className="text-amber-400">{report.warnings.length} warnings</span>
          <span className="text-slate-400">{report.suggestions.length} suggestions</span>
        </div>

        {clean && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <CheckCircle2 size={16} /> Wiring looks valid.
          </div>
        )}

        <div className="space-y-2">
          {report.errors.map((m, i) => (
            <Finding key={`e${i}`} tone="error" icon={<AlertTriangle size={14} />} text={m} />
          ))}
          {report.warnings.map((m, i) => (
            <Finding key={`w${i}`} tone="warn" icon={<AlertTriangle size={14} />} text={m} />
          ))}
          {report.suggestions.map((m, i) => (
            <Finding key={`s${i}`} tone="hint" icon={<Lightbulb size={14} />} text={m} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-3 rounded-sm" style={{ background: color }} />
      {label}
    </div>
  );
}

function Finding({ tone, icon, text }: { tone: 'error' | 'warn' | 'hint'; icon: ReactNode; text: string }) {
  const cls =
    tone === 'error'
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
      : tone === 'warn'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
        : 'border-slate-800 bg-slate-900/40 text-slate-400';
  return (
    <div className={`flex gap-2 rounded-lg border px-2.5 py-2 text-xs leading-relaxed ${cls}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
