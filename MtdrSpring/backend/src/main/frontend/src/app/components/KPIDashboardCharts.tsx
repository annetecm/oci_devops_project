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
  '#ef4444',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
];

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

  // ✅ Reshapes flat sprint+dev rows into one row per sprint with one key per developer.
  // Only used at render time inside GroupedChart — state data is never changed.
  // e.g. [{ sprint: 1, developer: "Alice", Completed: 2 }, { sprint: 1, developer: "Bob", Completed: 3 }]
  //   → [{ name: "Sprint 1", Alice: 2, Bob: 3, _avgTrend: 2.5 }]
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

  // generateChartData is 100% identical to the original — no changes
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
            const cost = hours * 50;
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
          const cost = hours * 50;
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
        'Avg Hours': Math.round(data.hours / Math.max(data.count, 1)),
      }))
    );
  };

  // ✅ GroupedChart: reshapes data at render time into one-row-per-sprint,
  // renders one <Bar> per developer (each with their stable color) + avg trend line.
  // Sprint-filtered mode uses Chart instead, so this is only ever called with all sprints.
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
      <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
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
            {/* ✅ Team average trend line */}
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
    <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
      <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
          <YAxis stroke="#64748b" tick={{ fontSize: 13 }} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          {(selectedChartType === 'both' || selectedChartType === 'bar') && (
            <Bar dataKey={barKey} fill="#3b82f6" name={barKey} />
          )}
          {(selectedChartType === 'both' || selectedChartType === 'line') && (
            <Line dataKey={lineKey} stroke="#22c55e" strokeWidth={2} dot={false} name={lineKey} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  if (isLoading) return <div className="text-center text-slate-600">Loading KPI data...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;

  return (
    <div>
      {/* Filters — completely unchanged */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-4 overflow-x-auto">
          <Filter className="w-5 h-5 text-slate-600" />

          {sprints.length > 0 && (
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
              <SelectTrigger className="w-48 text-base"><SelectValue placeholder="Filter by sprint" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-base">All Sprints</SelectItem>
                {sprints.map(sprint => (
                  <SelectItem key={sprint.id} value={String(sprint.id)} className="text-base">{sprint.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {userRole === 'manager' && developers.length > 0 && (
            <Select value={selectedDeveloper} onValueChange={setSelectedDeveloper}>
              <SelectTrigger className="w-48 text-base"><SelectValue placeholder="Filter by developer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-base">All Developers</SelectItem>
                {developers.map(dev => (
                  <SelectItem key={dev.id} value={dev.id} className="text-base">{dev.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedChartType} onValueChange={(value: any) => setSelectedChartType(value)}>
            <SelectTrigger className="w-48 text-base"><SelectValue placeholder="Chart type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="both" className="text-base">Bars & Line</SelectItem>
              <SelectItem value="bar" className="text-base">Bars Only</SelectItem>
              <SelectItem value="line" className="text-base">Line Only</SelectItem>
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

      {/* Team Overview — completely unchanged */}
      {showTeamOverview && (
        <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Team Overview</h3>
          <div className="grid grid-cols-4 gap-4">
            {developers.map(dev => {
              const devTasks = backendTasks.filter(t => String(t.developerID) === dev.id);
              const completed = devTasks.filter(t => t.status === 'closed').length;
              const hours = devTasks.reduce((sum, t) => sum + (t.timeSpent ?? 0), 0);
              const estimatedHours = devTasks.reduce((sum, t) => sum + (t.estimatedTime ?? 0), 0);
              const cost = hours * 50;
              return (
                <div key={dev.id} className="bg-slate-50 rounded-lg p-4">
                  <p className="font-semibold text-base text-slate-900 mb-3">{dev.name}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-base text-slate-600">Tasks:</span>
                      <span className="text-base font-medium text-slate-900">{completed}/{devTasks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base text-slate-600">Hours:</span>
                      <span className="text-base font-medium text-slate-900">{hours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base text-slate-600">Est Hours:</span>
                      <span className="text-base font-medium text-slate-900">{estimatedHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base text-slate-600">Cost:</span>
                      <span className="text-base font-medium text-slate-900">${cost}</span>
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