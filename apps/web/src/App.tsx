import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './shell/Sidebar';
import { TopBar } from './shell/TopBar';
import { StatusBar } from './shell/StatusBar';
import { Home } from './pages/Home';
import { LiveControl } from './pages/LiveControl';
import { Telemetry } from './pages/Telemetry';
import { Sensors } from './pages/Sensors';
import { Terminal } from './pages/Terminal';
import { Placeholder } from './pages/Placeholder';

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/control" element={<LiveControl />} />
            <Route path="/telemetry" element={<Telemetry />} />
            <Route path="/sensors" element={<Sensors />} />
            <Route path="/terminal" element={<Terminal />} />
            <Route path="/configuration" element={<Placeholder title="Configuration" note="Board, pins, drive geometry, transports." />} />
            <Route path="/settings" element={<Placeholder title="Settings" note="Theme, units, saved profiles." />} />
          </Routes>
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
