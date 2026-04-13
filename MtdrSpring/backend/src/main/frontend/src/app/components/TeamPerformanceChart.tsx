import { developers } from '../data/mockData';

export default function TeamPerformanceChart() {
  const maxTasks = Math.max(...developers.map(d => d.assignedTasksCount));

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
      <h3 className="text-slate-900 mb-4">Tasks Completed per Developer</h3>
      <p className="text-sm text-slate-600 mb-6">Completed vs Total Assigned Tasks</p>

      <div className="space-y-6">
        {developers.map((dev) => (
          <div key={dev.id}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-700">{dev.name}</p>
              <span className="text-xs text-slate-600">
                {dev.completedTasksCount}/{dev.assignedTasksCount} tasks
              </span>
            </div>
            <div className="relative h-10 bg-slate-100 rounded-lg overflow-hidden">
              {/* Total assigned tasks bar (background) */}
              <div
                className="absolute inset-y-0 left-0 bg-red-200 rounded-lg"
                style={{ width: `${(dev.assignedTasksCount / maxTasks) * 100}%` }}
              ></div>
              {/* Completed tasks bar (foreground) */}
              <div
                className="absolute inset-y-0 left-0 bg-red-600 rounded-lg flex items-center justify-end pr-3 transition-all duration-500"
                style={{ width: `${(dev.completedTasksCount / maxTasks) * 100}%` }}
              >
                <span className="text-white text-sm font-medium">{dev.completedTasksCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-600"></div>
          <span className="text-sm text-slate-600">Completed Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-200"></div>
          <span className="text-sm text-slate-600">Total Assigned</span>
        </div>
      </div>
    </div>
  );
}
