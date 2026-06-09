import { createBrowserRouter } from "react-router";
import RoleSelection from "./pages/RoleSelection";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerKanbanPage from "./pages/ManagerKanbanPage";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import DeveloperTaskList from "./pages/DeveloperTaskList";
import DeveloperKanbanPage from "./pages/DeveloperKanbanPage";
import DeveloperDashboard2 from "./pages/DeveloperDashboard2";
import TaskDetailView from "./pages/TaskDetailView";
import ManagerTaskDetailView from "./pages/ManagerTaskDetailView";
import ManagerKPI from "./pages/ManagerKPI";
import ManagerTaskList from "./pages/ManagerTaskList";
import DeveloperCalendarPage from "./pages/DeveloperCalendarPage";
import ManagerCalendarPage from "./pages/ManagerCalendarPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RoleSelection,
  },
  {
    path: "/manager",
    Component: ManagerTaskList,
  },
  {
    path: "/manager/kanban",
    Component: ManagerKanbanPage,
  },
    {
    path: "/manager/kpi",
    Component: ManagerKPI,
  },
  {
    path: "/manager/calendar",
    Component: ManagerCalendarPage,
  },
  {
    path: "/manager/task/:taskId",
    Component: ManagerTaskDetailView,
  },
  {
    path: "/developer/:developerId",
    Component: DeveloperTaskList,
  },
  {
    path: "/developer/:developerId/kanban",
    Component: DeveloperKanbanPage,
  },
  {
    path: "/developer/:developerId/kpi",
    Component: DeveloperDashboard2,
  },
  {
    path: "/developer/:developerId/calendar",
    Component: DeveloperCalendarPage,
  },
  {
    path: "/developer/task/:taskId",
    Component: TaskDetailView,
  },
]);
