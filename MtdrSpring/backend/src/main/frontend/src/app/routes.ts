import { createBrowserRouter } from "react-router";
import RoleSelection from "./pages/RoleSelection";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerDashboard2 from "./pages/ManagerDashboard2";
import ManagerKanbanPage from "./pages/ManagerKanbanPAge";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import DeveloperTaskList from "./pages/DeveloperTaskList";
import DeveloperKanbanPage from "./pages/DeveloperKanbanPage";
import DeveloperDashboard2 from "./pages/DeveloperDashboard2";
import TaskDetailView from "./pages/TaskDetailView";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RoleSelection,
  },
  {
    path: "/manager",
    Component: ManagerDashboard,
  },
  {
    path: "/manager/kanban",
    Component: ManagerKanbanPage,
  },
    {
    path: "/manager/kpi",
    Component: ManagerDashboard2,
  },
  {
    path: "/developer/:developerId",
    Component: DeveloperDashboard,
  },
  {
    path: "/developer/:developerId/task-list",
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
    path: "/developer/task/:taskId",
    Component: TaskDetailView,
  },
]);
