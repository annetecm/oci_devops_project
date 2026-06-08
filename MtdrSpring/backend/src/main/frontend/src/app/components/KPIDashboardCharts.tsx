import { useState, useEffect, useRef } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Filter } from 'lucide-react';
import {
  fetchTasks,
  fetchDeveloperSummaries,
  fetchDeveloperDashboard,
  DeveloperSummary,
  BackendTask,
  buildDeveloperMetricsFromBackend,
} from '../api/taskDataApi';

interface ChartDataItem {
  name: string;
  [key: string]: string | number;
}

interface KPIDashboardChartsProps {
  showTeamOverview?: boolean;
  developerId?: string;
  userRole?: 'manager' | 'developer';
}

const DEV_COLORS = [
  '#3b82f6',
  '#ec4899',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
];

const BAR_COLORS = [
  '#3b82f6',
  '#14b8a6',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#f472b6',
  '#e879f9',
  '#0ea5e9',
  '#22c55e',
  '#fb7185',
];

const getBarColor = (index: number) => BAR_COLORS[index % BAR_COLORS.length];

export default function KPIDashboardCharts({ showTeamOverview = true, developerId, userRole = 'manager' }: KPIDashboardChartsProps) {
  const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);
  const [developers, setDevelopers] = useState<DeveloperSummary[]>([]);
  const [sprints, setSprints] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSprint, setSelectedSprint] = useState<string>('all');
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>(developerId || 'all');
  const [selectedChartType, setSelectedChartType] = useState<'both' | 'bar' | 'line'>('both');

  const [tasksPerDeveloperData, setTasksPerDeveloperData] = useState<ChartDataItem[]>([]);
  const [hoursPerDeveloperData, setHoursPerDeveloperData] = useState<ChartDataItem[]>([]);
  const [costsPerDeveloperData, setCostsPerDeveloperData] = useState<ChartDataItem[]>([]);
  const [hoursPerCategoryData, setHoursPerCategoryData] = useState<ChartDataItem[]>([]);
  const [hoursVsEstimatedData, setHoursVsEstimatedData] = useState<ChartDataItem[]>([]);

  const devColorMapRef = useRef<Record<string, string>>({});

  // Only true when NO sprint/dev filter active
  const isGroupedMode = selectedDeveloper === 'all' && selectedSprint === 'all';

 
  const buildGroupedData = (flatData: ChartDataItem[], metricKey: string, trendKey: string): ChartDataItem[] => {
    const sprintMap = new Map<number, ChartDataItem>();

    flatData.forEach(row => {
      const sprint = row.sprint as number;
      const devName = row.developer as string;
      if (!sprintMap.has(sprint)) {
        sprintMap.set(sprint, { name: `Sprint ${sprint}`, _avgTrend: 0 });
      }
      const entry = sprintMap.get(sprint)!;
      entry[devName] = row[metricKey] as number;
    });

    // Compute average trend line across all developers per sprint
    return Array.from(sprintMap.values()).map(entry => {
      const devVals = developers.map(d => (entry[d.name] as number) ?? 0);
      const avg = devVals.length ? Math.round(devVals.reduce((a, b) => a + b, 0) / devVals.length) : 0;
      return { ...entry, _avgTrend: avg };
    });
  };

  useEffect(() => {
    async function loadData() {
      try {
        let tasksData: BackendTask[];

        if (developerId) {
          const dashboardData = await fetchDeveloperDashboard(developerId);
          tasksData = dashboardData.tasks;
        } else {
          tasksData = await fetchTasks();
        }

        const devs = await fetchDeveloperSummaries();
        setBackendTasks(tasksData);
        setDevelopers(devs);

        devs.forEach((dev, index) => {
          if (!devColorMapRef.current[dev.id]) {
            devColorMapRef.current[dev.id] = DEV_COLORS[index % DEV_COLORS.length];
          }
        });

        const uniqueSprints = new Map<number, string>();
        tasksData.forEach(task => {
          if (task.sprint) uniqueSprints.set(task.sprint, `Sprint ${task.sprint}`);
        });

        const sprintsList = Array.from(uniqueSprints.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.id - b.id);
        setSprints(sprintsList);

        generateChartData(tasksData, devs);
        setError(null);
      } catch (err) {
        setError('Failed to load KPI data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [developerId]);

  useEffect(() => {
    if (backendTasks.length > 0 && developers.length > 0) {
      let filteredTasks = backendTasks;
      if (selectedSprint !== 'all') {
        filteredTasks = backendTasks.filter(t => t.sprint === parseInt(selectedSprint));
      }
      generateChartData(filteredTasks, developers);
    }
  }, [selectedSprint, selectedDeveloper]);

  const generateChartData = (tasks: BackendTask[], devs: DeveloperSummary[]) => {
    const allSprints = new Set<number>();
    tasks.forEach(task => {
      if (task.sprint !== undefined) allSprints.add(task.sprint);
    });
    const sortedSprints = Array.from(allSprints).sort((a, b) => a - b);

    if (selectedDeveloper === 'all') {
      const tasksBySprintAndDev = new Map<string, { name: string; [key: string]: any }>();
      sortedSprints.forEach((sprint, sprintIndex) => {
        devs.forEach((dev, devIndex) => {
          const key = `${sprint}_${dev.id}`;
          tasksBySprintAndDev.set(key, {
            name: `${dev.name}\n(Sprint ${sprint})`,
            sprint,
            developer: dev.name,
            developerId: dev.id,
            sprintIndex,
            devIndex,
            Completed: 0,
            Assigned: 0,
          });
        });
      });
      tasks.forEach(task => {
        const sprint = task.sprint ?? 0;
        const devId = String(task.developerID);
        const dev = devs.find(d => d.id === devId);
        if (dev) {
          const data = tasksBySprintAndDev.get(`${sprint}_${devId}`);
          if (data) {
            data.Assigned += 1;
            if (task.status === 'closed') data.Completed += 1;
          }
        }
      });
      setTasksPerDeveloperData(Array.from(tasksBySprintAndDev.values()));

      const hoursBySprintAndDev = new Map<string, { name: string; [key: string]: any }>();
      sortedSprints.forEach((sprint, sprintIndex) => {
        devs.forEach((dev, devIndex) => {
          const key = `${sprint}_${dev.id}`;
          hoursBySprintAndDev.set(key, {
            name: `${dev.name}\n(Sprint ${sprint})`,
            sprint,
            developer: dev.name,
            developerId: dev.id,
            sprintIndex,
            devIndex,
            Hours: 0,
            Trend: 0,
          });
        });
      });
      tasks.forEach(task => {
        const sprint = task.sprint ?? 0;
        const devId = String(task.developerID);
        const dev = devs.find(d => d.id === devId);
        if (dev) {
          const data = hoursBySprintAndDev.get(`${sprint}_${devId}`);
          if (data) {
            const hours = task.timeSpent ?? 0;
            data.Hours += hours;
            data.Trend += hours * 0.8;
          }
        }
      });
      setHoursPerDeveloperData(Array.from(hoursBySprintAndDev.values()));

      const costsBySprintAndDev = new Map<string, { name: string; [key: string]: any }>();
      sortedSprints.forEach((sprint, sprintIndex) => {
        devs.forEach((dev, devIndex) => {
          const key = `${sprint}_${dev.id}`;
          costsBySprintAndDev.set(key, {
            name: `${dev.name}\n(Sprint ${sprint})`,
            sprint,
            developer: dev.name,
            developerId: dev.id,
            sprintIndex,
            devIndex,
            Cost: 0,
            'Avg Cost': 0,
          });
        });
      });
      tasks.forEach(task => {
        const sprint = task.sprint ?? 0;
        const devId = String(task.developerID);
        const dev = devs.find(d => d.id === devId);
        if (dev) {
          const data = costsBySprintAndDev.get(`${sprint}_${devId}`);
          if (data) {
            const hours = task.timeSpent ?? 0;
            const cost = hours * 24;
            data.Cost += cost;
            data['Avg Cost'] += cost * 0.9;
          }
        }
      });
      setCostsPerDeveloperData(Array.from(costsBySprintAndDev.values()).map(item => ({
        ...item,
        Cost: Math.round(item.Cost),
        'Avg Cost': Math.round(item['Avg Cost']),
      })));

    } else {
      const selectedDev = devs.find(d => d.id === selectedDeveloper);
      if (selectedDev) {
        const devTasks = tasks.filter(t => String(t.developerID) === selectedDeveloper);

        setTasksPerDeveloperData(sortedSprints.map(sprint => {
          const sprintTasks = devTasks.filter(t => (t.sprint ?? 0) === sprint);
          return { name: `Sprint ${sprint}`, Completed: sprintTasks.filter(t => t.status === 'closed').length, Assigned: sprintTasks.length };
        }));

        setHoursPerDeveloperData(sortedSprints.map(sprint => {
          const sprintTasks = devTasks.filter(t => (t.sprint ?? 0) === sprint);
          const hours = sprintTasks.reduce((sum, t) => sum + (t.timeSpent ?? 0), 0);
          return { name: `Sprint ${sprint}`, Hours: hours, Trend: Math.round(hours * 0.8) };
        }));

        setCostsPerDeveloperData(sortedSprints.map(sprint => {
          const sprintTasks = devTasks.filter(t => (t.sprint ?? 0) === sprint);
          const hours = sprintTasks.reduce((sum, t) => sum + (t.timeSpent ?? 0), 0);
          const cost = hours * 24;
          return { name: `Sprint ${sprint}`, Cost: Math.round(cost), 'Avg Cost': Math.round(cost * 0.9) };
        }));

        setHoursVsEstimatedData(sortedSprints.map(sprint => {
          const sprintTasks = devTasks.filter(t => (t.sprint ?? 0) === sprint);
          return {
            name: `Sprint ${sprint}`,
            'Total Hours Worked': sprintTasks.reduce((sum, t) => sum + (t.timeSpent ?? 0), 0),
            'Estimated Hours': sprintTasks.reduce((sum, t) => sum + (t.estimatedTime ?? 0), 0),
          };
        }));
      }
    }

    const hoursByCategory = new Map<string, { hours: number; count: number }>();
    const filteredTasksForCategory = selectedDeveloper === 'all'
      ? tasks
      : tasks.filter(t => String(t.developerID) === selectedDeveloper);

    filteredTasksForCategory.forEach(task => {
      const category = task.taskType || 'Other';
      if (!hoursByCategory.has(category)) hoursByCategory.set(category, { hours: 0, count: 0 });
      const data = hoursByCategory.get(category)!;
      data.hours += task.timeSpent ?? 0;
      data.count += 1;
    });

    setHoursPerCategoryData(
      Array.from(hoursByCategory.entries()).map(([category, data]) => ({
        name: category,
        Hours: data.hours,
        'Avg Hours': data.hours,
      }))
    );
  };

  const GroupedChart = ({
    title,
    data,
    metricKey,
    trendKey,
  }: {
    title: string;
    data: ChartDataItem[];
    metricKey: string;
    trendKey: string;
  }) => {
    const groupedData = buildGroupedData(data, metricKey, trendKey);

    return (
      <div className="relative bg-white rounded-xl p-6 pt-7 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow overflow-hidden">
        <span className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-800 via-red-600 to-amber-500" />
        <div className="mb-5">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">By sprint · per developer</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={groupedData} barCategoryGap="20%" barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 13 }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            {/* ✅ One <Bar> per developer with their stable color */}
            {(selectedChartType === 'both' || selectedChartType === 'bar') &&
              developers.map((dev, index) => (
                <Bar
                  key={dev.id}
                  dataKey={dev.name}
                  name={dev.name}
                  fill={devColorMapRef.current[dev.id] ?? DEV_COLORS[index % DEV_COLORS.length]}
                />
              ))
            }
            {/*  Team average trend line */}
            {(selectedChartType === 'both' || selectedChartType === 'line') && (
              <Line
                dataKey="_avgTrend"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                name="Team Avg"
                strokeDasharray="5 5"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Standard chart: identical to original
  const Chart = ({ title, data, barKey, lineKey }: { title: string; data: ChartDataItem[]; barKey: string; lineKey: string }) => (
    <div className="relative bg-white rounded-xl p-6 pt-7 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow overflow-hidden">
      <span className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-800 via-red-600 to-amber-500" />
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{barKey} vs {lineKey}</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
          <YAxis stroke="#64748b" tick={{ fontSize: 13 }} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          {(selectedChartType === 'both' || selectedChartType === 'bar') && (
            <Bar dataKey={barKey} name={barKey}>
              {data.map((entry, index) => (
                <Cell key={`${barKey}-${entry.name}-${index}`} fill={getBarColor(index)} />
              ))}
            </Bar>
          )}
          {(selectedChartType === 'both' || selectedChartType === 'line') && (
            <Line dataKey={lineKey} stroke="#22c55e" strokeWidth={2} dot={false} name={lineKey} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  if (isLoading) return <div className="text-center text-slate-600 py-10">Loading KPI data...</div>;
  if (error) return <div className="text-center text-red-600 py-10">{error}</div>;

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 pr-3 mr-1 border-r border-slate-200 text-slate-700 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Filter className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Filters</span>
          </div>

          {sprints.length > 0 && (
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
              <SelectTrigger className="w-48 bg-slate-50 border-slate-200 hover:bg-white transition-colors"><SelectValue placeholder="Filter by sprint" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sprints</SelectItem>
                {sprints.map(sprint => (
                  <SelectItem key={sprint.id} value={String(sprint.id)}>{sprint.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {userRole === 'manager' && developers.length > 0 && (
            <Select value={selectedDeveloper} onValueChange={setSelectedDeveloper}>
              <SelectTrigger className="w-48 bg-slate-50 border-slate-200 hover:bg-white transition-colors"><SelectValue placeholder="Filter by developer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Developers</SelectItem>
                {developers.map(dev => (
                  <SelectItem key={dev.id} value={dev.id}>{dev.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedChartType} onValueChange={(value: any) => setSelectedChartType(value)}>
            <SelectTrigger className="w-48 bg-slate-50 border-slate-200 hover:bg-white transition-colors"><SelectValue placeholder="Chart type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Bars & Line</SelectItem>
              <SelectItem value="bar">Bars Only</SelectItem>
              <SelectItem value="line">Line Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Charts Grid */}
      {userRole === 'developer' ? (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {isGroupedMode ? (
            <>
              <GroupedChart title="Tasks Completed" data={tasksPerDeveloperData} metricKey="Completed" trendKey="Assigned" />
              <GroupedChart title="Hours Worked" data={hoursPerDeveloperData} metricKey="Hours" trendKey="Trend" />
            </>
          ) : (
            <>
              <Chart title="Tasks Completed" data={tasksPerDeveloperData} barKey="Completed" lineKey="Assigned" />
              <Chart title="Hours Worked" data={hoursPerDeveloperData} barKey="Hours" lineKey="Trend" />
            </>
          )}
          <Chart title="Hours Worked vs Estimated Hours" data={hoursVsEstimatedData} barKey="Total Hours Worked" lineKey="Estimated Hours" />
          <Chart title="Hours by Task Category" data={hoursPerCategoryData} barKey="Hours" lineKey="Avg Hours" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {isGroupedMode ? (
            <>
              <GroupedChart title="Tasks Completed per Developer" data={tasksPerDeveloperData} metricKey="Completed" trendKey="Assigned" />
              <GroupedChart title="Hours Worked per Developer" data={hoursPerDeveloperData} metricKey="Hours" trendKey="Trend" />
              <GroupedChart title="Costs per Developer" data={costsPerDeveloperData} metricKey="Cost" trendKey="Avg Cost" />
            </>
          ) : (
            <>
              <Chart title="Tasks Completed per Developer" data={tasksPerDeveloperData} barKey="Completed" lineKey="Assigned" />
              <Chart title="Hours Worked per Developer" data={hoursPerDeveloperData} barKey="Hours" lineKey="Trend" />
              <Chart title="Costs per Developer" data={costsPerDeveloperData} barKey="Cost" lineKey="Avg Cost" />
            </>
          )}
          <Chart title="Hours Worked per Task Category" data={hoursPerCategoryData} barKey="Hours" lineKey="Avg Hours" />
        </div>
      )}

      {/* Team Overview */}
      {showTeamOverview && (
        <div className="relative bg-white rounded-xl p-6 pt-7 shadow-sm border border-slate-200/80 overflow-hidden">
          <span className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-800 via-red-600 to-amber-500" />
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Team Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Per-developer roll-up across all sprints</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {developers.map((dev, index) => {
              const devTasks = backendTasks.filter(t => String(t.developerID) === dev.id);
              const completed = devTasks.filter(t => t.status === 'closed').length;
              const hours = devTasks.reduce((sum, t) => sum + (t.timeSpent ?? 0), 0);
              const estimatedHours = devTasks.reduce((sum, t) => sum + (t.estimatedTime ?? 0), 0);
              const cost = hours * 24;
              const devColor = devColorMapRef.current[dev.id] ?? DEV_COLORS[index % DEV_COLORS.length];
              const completionPct = devTasks.length ? Math.round((completed / devTasks.length) * 100) : 0;
              return (
                <div key={dev.id} className="relative bg-gradient-to-br from-slate-50/80 via-white to-white rounded-xl border border-slate-200/80 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
                  <span className="absolute top-0 bottom-0 left-0 w-1" style={{ backgroundColor: devColor }} />
                  <div className="flex items-center gap-3 mb-3 pl-1">
                    <div
                      className="w-9 h-9 rounded-full text-white text-xs font-semibold flex items-center justify-center shadow-sm shrink-0"
                      style={{ backgroundColor: devColor }}
                    >
                      {(dev.initials || dev.name.split(' ').map(w => w[0]).join('')).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{dev.name}</p>
                      <p className="text-[11px] text-slate-500">{completionPct}% complete</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 pl-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tasks</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{completed}/{devTasks.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Hours</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{hours}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Est. Hours</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{estimatedHours}h</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1.5 mt-1.5 border-t border-slate-100">
                      <span className="text-slate-500">Cost</span>
                      <span className="font-bold text-slate-900 tabular-nums">${cost}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}