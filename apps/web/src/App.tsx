import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './shell/Sidebar';
import { TopBar } from './shell/TopBar';
import { StatusBar } from './shell/StatusBar';
import { Dashboard } from './pages/Dashboard';
import { Placeholder } from './pages/Placeholder';

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/control" element={<Placeholder title="Control" note="Full-screen driving view — gamepad, keyboard, voice." />} />
            <Route path="/telemetry" element={<Placeholder title="Telemetry" note="Multi-series charts, logging, export." />} />
            <Route path="/sensors" element={<Placeholder title="Sensors" note="Add and configure sensors with per-sensor wizards." />} />
            <Route path="/configuration" element={<Placeholder title="Configuration" note="Board, pins, drive geometry, transports." />} />
            <Route path="/terminal" element={<Placeholder title="Terminal" note="Live serial / network monitor." />} />
            <Route path="/settings" element={<Placeholder title="Settings" note="Theme, units, saved profiles." />} />
          </Routes>
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
