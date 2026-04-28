interface HoursWorkedItem {
  name: string;
  hoursWorked: number;
}

interface HoursWorkedChartProps {
  data: HoursWorkedItem[];
}

export default function HoursWorkedChart({ data }: HoursWorkedChartProps) {

  const maxHours = Math.max(...data.map((d) => d.hoursWorked), 1);
  const barColors = ['bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

  return (
    <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200">
      <h3 className="text-slate-900 mb-3">Hours Worked per Developer</h3>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">Total hours worked by sprint</p>
      </div>

      <div className="space-y-4">
        {data.map((dev, index) => {
          const colorClass = barColors[index % barColors.length];
          return (
            <div key={dev.name}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-slate-700">{dev.name}</p>
                <span className="text-xs text-slate-600">{dev.hoursWorked} hours</span>
              </div>
              <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${colorClass} rounded-lg flex items-center justify-end pr-3 transition-all duration-500`}
                  style={{ width: `${(dev.hoursWorked / maxHours) * 100}%` }}
                >
                  <span className="text-white text-sm font-medium">{dev.hoursWorked}h</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t border-slate-200">
        {data.map((dev, index) => (
          <div key={dev.name} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${barColors[index % barColors.length]}`}></div>
            <span className="text-sm text-slate-600">{dev.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
