package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class Dashboardcontroller {

    private final DashboardService dashboardService;

    public Dashboardcontroller(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/manager")
    public ResponseEntity<DashboardService.DashboardData> getManagerDashboard(
            @RequestParam(required = false) Integer projectID) {
        return ResponseEntity.ok(dashboardService.getManagerDashboard(projectID));
    }

    @GetMapping("/developer/{developerID}")
    public ResponseEntity<DashboardService.DashboardData> getDeveloperDashboard(
            @PathVariable Integer developerID,
            @RequestParam(required = false) Integer projectID) {
        return ResponseEntity.ok(dashboardService.getDeveloperDashboard(developerID, projectID));
    }

    @GetMapping("/tasks/{taskID}")
    public ResponseEntity<Task> getTask(@PathVariable Integer taskID) {
        return dashboardService.getTask(taskID)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/tasks/{taskID}")
    public ResponseEntity<Task> updateTask(
            @PathVariable Integer taskID,
            @RequestBody Map<String, Object> body) {
        String status = body.get("status") != null ? body.get("status").toString() : null;
        Integer timeSpent = body.get("timeSpent") != null
                ? Integer.valueOf(body.get("timeSpent").toString()) : null;
        return dashboardService.updateTask(taskID, status, timeSpent)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}