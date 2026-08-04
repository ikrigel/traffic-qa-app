'use client';

export default function DevkitConsolePanel() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Live Debugging Console</h3>
      <p className="text-gray-600">
        DevKit Console provides real-time client-side debugging, log history, and performance monitoring.
      </p>
      <div className="bg-gray-100 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
        <p className="text-gray-600">Live console would render here (requires devkit-console-ui setup)</p>
      </div>
    </div>
  );
}
