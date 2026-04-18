interface SprintHoursData {
  sprintId: number;
  sprintName: string;
  hoursWorked: number;
}

interface DeveloperSprintHoursChartProps {
  backendTasks: Array<{
    taskID: number;
    name: string;
    description: string;
    status: string;
    taskType: string;
    startDate: string;
    deadline: string;
    developerID: number;
    estimatedTime: number;
    timeSpent?: number;
    priority: string;
    projectID: number;
    createdAt: string;
    updatedAt: string;
    sprint?: number;
  }>;
  developerId: string;
}

export default function DeveloperSprintHoursChart({ backendTasks, developerId }: DeveloperSprintHoursChartProps) {
  // Filter tasks for this developer and group by sprint
  const developerTasks = backendTasks.filter(task => String(task.developerID) === developerId);

  // Group tasks by sprint and calculate total hours worked
  const sprintHoursMap = new Map<number, number>();

  developerTasks.forEach(task => {
    if (task.sprint !== undefined) {
      const currentHours = sprintHoursMap.get(task.sprint) || 0;
      const taskHours = task.timeSpent || 0;
      sprintHoursMap.set(task.sprint, currentHours + taskHours);
    }
  });

  // Convert to array and sort by sprint ID
  const sprintData: SprintHoursData[] = Array.from(sprintHoursMap.entries())
    .map(([sprintId, hoursWorked]) => ({
      sprintId,
      sprintName: `Sprint ${sprintId}`,
      hoursWorked
    }))
    .sort((a, b) => a.sprintId - b.sprintId);

  // If no sprint data, show empty state
  if (sprintData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200 flex-1">
        <h3 className="text-slate-900 mb-3">Hours Worked by Sprint</h3>
        <div className="flex items-center justify-center h-32 text-slate-500">
          <p>No sprint data available</p>
        </div>
      </div>
    );
  }

  const maxHours = Math.max(...sprintData.map(d => d.hoursWorked), 1);

  return (
    <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200 flex-1">
      <h3 className="text-slate-900 mb-3">Hours Worked by Sprint</h3>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">Time spent on tasks per sprint (live DB data)</p>
      </div>

      <div className="flex flex-col justify-center gap-4">
        {sprintData.map((sprint) => {
          const widthPercentage = (sprint.hoursWorked / maxHours) * 100;
          const barWidth = Math.max(widthPercentage, 5); // Minimum width for visibility

          return (
            <div key={sprint.sprintId} className="flex items-center gap-3">
              <div className="w-20 text-sm text-slate-600 font-medium text-right">
                {sprint.sprintName}
              </div>
              <div className="flex-1 relative h-10 bg-slate-100 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded transition-all duration-500 hover:bg-blue-600 flex items-center justify-end pr-2"
                  style={{ width: `${barWidth}%` }}
                >
                  {barWidth > 15 && (
                    <span className="text-xs text-white font-medium">{sprint.hoursWorked}h</span>
                  )}
                </div>
              </div>
              {barWidth <= 15 && (
                <div className="w-12 text-xs text-slate-600 font-medium text-left">
                  {sprint.hoursWorked}h
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-start gap-3 mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-sm text-slate-600">Hours Worked</span>
        </div>
      </div>
    </div>
  );
}