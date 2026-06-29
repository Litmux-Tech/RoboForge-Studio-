import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './shell/Sidebar';
import { TopBar } from './shell/TopBar';
import { StatusBar } from './shell/StatusBar';
import { Home } from './pages/Home';
import { LiveControl } from './pages/LiveControl';
import { Telemetry } from './pages/Telemetry';
import { Sensors } from './pages/Sensors';
import { Terminal } from './pages/Terminal';
import { Configuration } from './pages/Configuration';
import { Settings } from './pages/Settings';
import { Placeholder } from './pages/Placeholder';

// esptool-js and React Flow are heavy — keep them out of the main bundle.
const Flash = lazy(() => import('./pages/Flash').then((m) => ({ default: m.Flash })));
const CircuitBuilder = lazy(() => import('./pages/CircuitBuilder').then((m) => ({ default: m.CircuitBuilder })));

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-hidden">
          <Suspense fallback={<div className="grid h-full place-items-center text-sm text-slate-500">Loading…</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/control" element={<LiveControl />} />
              <Route path="/telemetry" element={<Telemetry />} />
              <Route path="/sensors" element={<Sensors />} />
              <Route path="/circuit" element={<CircuitBuilder />} />
              <Route path="/flash" element={<Flash />} />
              <Route path="/terminal" element={<Terminal />} />
              <Route path="/configuration" element={<Configuration />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Placeholder title="Not Found" note="That screen doesn't exist yet." />} />
            </Routes>
          </Suspense>
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
