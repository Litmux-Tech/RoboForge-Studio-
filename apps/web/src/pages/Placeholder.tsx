export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <div className="grid min-h-screen place-items-center p-10 text-center">
      <div className="max-w-md">
        <div className="text-2xl font-semibold text-slate-200">{title}</div>
        <p className="mt-2 text-sm text-slate-500">
          {note ?? 'On the roadmap.'} The spine that powers it — profile, transport, telemetry — is
          already live; wiring the UI next.
        </p>
      </div>
    </div>
  );
}
