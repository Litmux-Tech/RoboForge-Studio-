import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
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
import type { LucideIcon } from 'lucide-react';
import {
  Cpu,
  CircuitBoard,
  Cog,
  Radar,
  BatteryFull,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import type { RobotProfile } from '@roboforge/core';
import { useRobot } from '../store';

type Kind = 'power' | 'controller' | 'driver' | 'motor' | 'sensor';
interface CompData {
  label: string;
  kind: Kind;
  detail?: string;
  [key: string]: unknown;
}

const KIND_META: Record<Kind, { color: string; icon: LucideIcon }> = {
  power: { color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200', icon: BatteryFull },
  controller: { color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200', icon: Cpu },
  driver: { color: 'border-amber-500/40 bg-amber-500/10 text-amber-200', icon: Cog },
  motor: { color: 'border-slate-600 bg-slate-800/80 text-slate-200', icon: CircuitBoard },
  sensor: { color: 'border-violet-500/40 bg-violet-500/10 text-violet-200', icon: Radar },
};

function ComponentNode({ data }: NodeProps) {
  const d = data as CompData;
  const meta = KIND_META[d.kind];
  const Icon = meta.icon;
  return (
    <div className={`min-w-[124px] rounded-xl border px-3 py-2 text-xs shadow-lg ${meta.color}`}>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-slate-400 !bg-slate-300" />
      <div className="flex items-center gap-1.5 font-semibold">
        <Icon size={13} /> {d.label}
      </div>
      {d.detail && <div className="mt-0.5 text-[10px] opacity-70">{d.detail}</div>}
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-slate-400 !bg-slate-300" />
    </div>
  );
}

const nodeTypes: NodeTypes = { component: ComponentNode };

const PALETTE: { kind: Kind; label: string }[] = [
  { kind: 'controller', label: 'ESP32' },
  { kind: 'controller', label: 'Arduino Uno' },
  { kind: 'driver', label: 'L298N' },
  { kind: 'driver', label: 'TB6612' },
  { kind: 'motor', label: 'DC Motor' },
  { kind: 'sensor', label: 'Ultrasonic' },
  { kind: 'sensor', label: 'IMU' },
  { kind: 'sensor', label: 'IR Sensor' },
  { kind: 'power', label: 'Battery' },
];

function buildGraph(profile: RobotProfile): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const node = (id: string, kind: Kind, label: string, x: number, y: number, detail?: string) =>
    nodes.push({ id, type: 'component', position: { x, y }, data: { label, kind, detail } });
  const edge = (s: string, t: string, power = false) =>
    edges.push({ id: `${s}-${t}`, source: s, target: t, animated: power, style: { stroke: power ? '#34d399' : '#475569' } });

  node('battery', 'power', 'Li-ion 7.4V', 0, 150);
  node('esp32', 'controller', profile.board.toUpperCase(), 230, 130, 'WiFi + BLE');
  node('driver', 'driver', profile.drive.driverChip.toUpperCase(), 480, 50, 'Motor driver');
  edge('battery', 'esp32', true);
  edge('battery', 'driver', true);
  edge('esp32', 'driver');

  profile.drive.motors.forEach((m, i) => {
    node(`m_${m.id}`, 'motor', m.id.replace(/_/g, ' '), 740, i * 80, 'DC motor');
    edge('driver', `m_${m.id}`);
  });
  profile.sensors.forEach((s, i) => {
    node(`s_${s.id}`, 'sensor', s.label ?? s.id, 480, 210 + i * 92, s.driver);
    edge('esp32', `s_${s.id}`);
  });

  return { nodes, edges };
}

interface Report {
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

function validate(nodes: Node[], edges: Edge[], driverLabel: string): Report {
  const byId = new Map(nodes.map((n) => [n.id, n.data as CompData]));
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const n of nodes) {
    const d = n.data as CompData;
    if (d.kind === 'motor') {
      const incoming = edges.filter((e) => e.target === n.id);
      const fromDriver = incoming.some((e) => byId.get(e.source)?.kind === 'driver');
      const fromController = incoming.some((e) => byId.get(e.source)?.kind === 'controller');
      if (fromController && !fromDriver)
        errors.push(`${d.label}: a DC motor can't be driven directly from a GPIO — route it through the ${driverLabel} motor driver (GPIO sources only ~12 mA).`);
      else if (!fromDriver) warnings.push(`${d.label} isn't connected to a motor driver.`);
    }
    if (d.kind === 'driver') {
      const powered = edges.some((e) => e.target === n.id && byId.get(e.source)?.kind === 'power');
      if (!powered) warnings.push(`${d.label} has no power connection.`);
    }
  }

  const suggestions = [
    'Add a voltage divider to GPIO34 to monitor battery charge.',
    'Add a decoupling capacitor across the motor supply rails.',
  ];
  return { errors, warnings, suggestions };
}

export function CircuitBuilder() {
  const { profile } = useRobot();
  const initial = useMemo(() => buildGraph(profile), [profile]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [seq, setSeq] = useState(1000);

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge({ ...c, style: { stroke: '#475569' } }, eds)),
    [setEdges],
  );

  const addComponent = (kind: Kind, label: string) => {
    const id = `${kind}_${seq}`;
    setSeq((s) => s + 1);
    setNodes((ns) =>
      ns.concat({ id, type: 'component', position: { x: 300, y: 40 + (seq % 6) * 26 }, data: { label, kind } }),
    );
  };

  const report = useMemo(() => validate(nodes, edges, profile.drive.driverChip.toUpperCase()), [nodes, edges, profile]);
  const clean = report.errors.length === 0 && report.warnings.length === 0;

  return (
    <div className="flex h-full">
      <div className="w-44 shrink-0 overflow-y-auto border-r border-slate-800 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Components</div>
        <div className="space-y-1.5">
          {PALETTE.map((p) => {
            const Icon = KIND_META[p.kind].icon;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => addComponent(p.kind, p.label)}
                className="flex w-full items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2 text-xs text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800/60"
              >
                <Icon size={14} className="text-slate-400" />
                <span className="flex-1 text-left">{p.label}</span>
                <Plus size={12} className="text-slate-600" />
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-600">
          Click to add · drag handles to wire · the validator checks every connection live.
        </p>
      </div>

      <div className="relative min-w-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap pannable zoomable className="!bg-slate-900" />
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
