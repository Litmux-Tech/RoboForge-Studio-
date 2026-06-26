import { useRef, useState } from 'react';

/**
 * Pointer joystick. Reports throttle/steer in -1..1 (up = +throttle). Returns to
 * centre (and emits 0,0) on release. Feeds straight into store.drive().
 */
export function Joystick({
  onChange,
  size = 200,
  disabled = false,
}: {
  onChange: (thr: number, str: number) => void;
  size?: number;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const radius = size / 2;
  const maxOffset = radius - 26;

  const move = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let dx = clientX - (rect.left + radius);
    let dy = clientY - (rect.top + radius);
    const dist = Math.hypot(dx, dy);
    if (dist > maxOffset) {
      dx = (dx / dist) * maxOffset;
      dy = (dy / dist) * maxOffset;
    }
    setKnob({ x: dx, y: dy });
    onChange(-dy / maxOffset, dx / maxOffset);
  };

  const reset = () => {
    setKnob({ x: 0, y: 0 });
    onChange(0, 0);
  };

  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (disabled || !e.buttons) return;
        move(e.clientX, e.clientY);
      }}
      onPointerUp={reset}
      onPointerCancel={reset}
      className={`relative rounded-full border border-slate-700 bg-slate-900/80 ${
        disabled ? 'opacity-40' : 'cursor-grab active:cursor-grabbing'
      }`}
      style={{ width: size, height: size, touchAction: 'none' }}
    >
      <div className="pointer-events-none absolute bottom-5 left-1/2 top-5 w-px -translate-x-1/2 bg-slate-800" />
      <div className="pointer-events-none absolute left-5 right-5 top-1/2 h-px -translate-y-1/2 bg-slate-800" />
      <div
        className="pointer-events-none absolute grid place-items-center rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/30 transition-transform"
        style={{ width: 52, height: 52, left: radius - 26 + knob.x, top: radius - 26 + knob.y }}
      >
        <div className="h-3.5 w-3.5 rounded-full bg-white/80" />
      </div>
    </div>
  );
}
