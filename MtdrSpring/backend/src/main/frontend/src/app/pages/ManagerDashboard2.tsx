import { useState } from 'react';
import Header2 from '../components/Header2';
import Sidebar from '../components/Sidebar';
import KPIDashboardCharts from '../components/KPIDashboardCharts';

export default function ManagerDashboard2() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userRole="manager" />
      <Header2
        title="KPI Dashboard"
        subtitle="Monitor team performance metrics and key indicators"
        onMenuClick={() => setSidebarOpen(true)}
      />

      <main className="p-8">
        <KPIDashboardCharts showTeamOverview={true} />
      </main>
    </div>
  );
}
