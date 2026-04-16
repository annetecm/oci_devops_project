package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.service.DashboardService;
import com.springboot.MyTodoList.service.DashboardService.DashboardData;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/dashboard/manager?projectID=1
     *
     * Returns aggregated stats for ALL developers on a project.
     * projectID is optional — omit it to get stats across all projects.
     *
     * Response shape (matches what the frontend api.ts expects):
     * {
     *   developers:  [ { developerID, userID, teamID, assignedTasksCount, completedTasksCount, hoursWorked, estimatedHours } ],
     *   sprintStats: [ { sprintId, devId, assignedTasksCount, completedTasksCount, hoursWorked } ],
     *   sprints:     [ { id, name } ],
     *   tasks:       [ { taskID, name, description, status, taskType, priority, sprint, developerID, projectID,
     *                    startDate, deadline, estimatedTime, timeSpent, createdAt, updatedAt } ]
     * }
     */
    @GetMapping("/manager")
    public ResponseEntity<DashboardData> getManagerDashboard(
            @RequestParam(required = false) Integer projectID) {
        return ResponseEntity.ok(dashboardService.getManagerDashboard(projectID));
    }

    /**
     * GET /api/dashboard/developer/{developerID}?projectID=1
     *
     * Returns tasks and stats scoped to a single developer.
     * projectID is optional.
     */
    @GetMapping("/developer/{developerID}")
    public ResponseEntity<DashboardData> getDeveloperDashboard(
            @PathVariable Integer developerID,
            @RequestParam(required = false) Integer projectID) {
        return ResponseEntity.ok(dashboardService.getDeveloperDashboard(developerID, projectID));
    }

    /**
     * GET /api/dashboard/tasks/{taskID}
     *
     * Single task detail view.
     */
    @GetMapping("/tasks/{taskID}")
    public ResponseEntity<Task> getTask(@PathVariable Integer taskID) {
        return dashboardService.getTask(taskID)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * PATCH /api/dashboard/tasks/{taskID}
     *
     * Partial update — only status and timeSpent can be changed from the UI.
     *
     * Request body (both fields optional):
     * { "status": "in_progress", "timeSpent": 4 }
     */
    @PatchMapping("/tasks/{taskID}")
    public ResponseEntity<Task> updateTask(
            @PathVariable Integer taskID,
            @RequestBody Map<String, Object> body) {
        String  status    = (String)  body.get("status");
        Integer timeSpent = body.get("timeSpent") != null
                ? ((Number) body.get("timeSpent")).intValue()
                : null;
        return dashboardService.updateTask(taskID, status, timeSpent)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}