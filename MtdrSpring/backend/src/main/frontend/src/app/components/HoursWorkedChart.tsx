import { developers } from '../data/mockData';

export default function HoursWorkedChart() {
  const maxHours = Math.max(...developers.map(d => d.hoursWorked));

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
      <h3 className="text-slate-900 mb-4">Hours Worked per Developer</h3>
      <p className="text-sm text-slate-600 mb-6">Total hours worked this sprint</p>

      <div className="space-y-6">
        {developers.map((dev) => (
          <div key={dev.id}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-700">{dev.name}</p>
              <span className="text-xs text-slate-600">{dev.hoursWorked} hours</span>
            </div>
            <div className="relative h-10 bg-slate-100 rounded-lg overflow-hidden">
              <div
                className="h-full bg-red-700 rounded-lg flex items-center justify-end pr-3 transition-all duration-500"
                style={{ width: `${(dev.hoursWorked / maxHours) * 100}%` }}
              >
                <span className="text-white text-sm font-medium">{dev.hoursWorked}h</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-slate-200">
        <div className="w-3 h-3 rounded bg-red-700"></div>
        <span className="text-sm text-slate-600">Hours Worked</span>
      </div>
    </div>
  );
}
