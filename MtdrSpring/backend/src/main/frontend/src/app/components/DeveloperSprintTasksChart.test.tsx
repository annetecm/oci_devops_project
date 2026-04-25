// @vitest-environment jsdom

import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DeveloperSprintTasksChart from "./DeveloperSprintTasksChart";
import '@testing-library/jest-dom';

describe("A list of tasks completed per sprint. Ensure that the minimum information is present in each ticket: Task Name, Developer Name, Estimated Hours, Actual Hours", () => {
    test("It should display completed tasks per sprint", () => {
        const mockTasks = [
            {
                taskID: 1,
                name: "Fix Login",
                description: "Authentication fix",
                status: "closed",
                taskType: "bug",
                startDate: "2026-01-01",
                deadline: "2026-01-10",
                developerID: 1,
                estimatedTime: 5,
                timeSpent: 6,
                priority: "high",
                projectID: 1,
                createdAt: "2026-01-01",
                updatedAt: "2026-01-02",
                sprint: 1
            },
            {
                taskID: 2,
                name: "Dashboard UI",
                description: "Frontend improvements",
                status: "closed",
                taskType: "feature",
                startDate: "2026-01-01",
                deadline: "2026-01-10",
                developerID: 1,
                estimatedTime: 8,
                timeSpent: 7,
                priority: "medium",
                projectID: 1,
                createdAt: "2026-01-01",
                updatedAt: "2026-01-02",
                sprint: 1
            },
            {
                taskID: 3,
                name: "Implement AI",
                description: "Use of AI in the chatbot",
                status: "closed",
                taskType: "feature",
                startDate: "2026-01-01",
                deadline: "2026-01-10",
                developerID: 1,
                estimatedTime: 8,
                timeSpent: 7,
                priority: "medium",
                projectID: 1,
                createdAt: "2026-01-01",
                updatedAt: "2026-01-02",
                sprint:2
            }
        ];
        render(
            <DeveloperSprintTasksChart
                backendTasks={mockTasks}
                developerId="1"
            />
        );
        //[0] is indicative of the Sprint 1 (the first one)
        const sprint1Name = screen.getAllByTestId('DevSprintTask-SprintName');
        expect(sprint1Name[0]).toHaveTextContent("Sprint 1");
        const tasks1Done = screen.getAllByTestId("DevSprintTask-NumberTasks");
        expect(tasks1Done[0]).toHaveTextContent("2");

        //[1] is indicative of sprint 2
        const sprint2Name = screen.getAllByTestId('DevSprintTask-SprintName');
        expect(sprint2Name[1]).toHaveTextContent("Sprint 2");
        const tasks2Done = screen.getAllByTestId("DevSprintTask-NumberTasks");
        expect(tasks2Done[1]).toHaveTextContent("1");

    });

});