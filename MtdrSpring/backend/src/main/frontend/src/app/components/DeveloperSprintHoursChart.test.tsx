// @vitest-environment jsdom

import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DeveloperSprintHoursChart from "./DeveloperSprintHoursChart";
import '@testing-library/jest-dom';

describe("KPIs: Hours worked and tasks completed by each PERSON per week/sprint.", () => {
    test("It should display worked hours based on a task with a sprint for a developer", () => {
        const mockTasks = [
            {
                taskID: 1,
                name: "Fix Login",
                description: "Fix login issue",
                status: "closed",
                taskType: "bug",
                startDate: "2026-01-01",
                deadline: "2026-01-10",
                developerID: 1,
                estimatedTime: 5,
                timeSpent: 8,
                priority: "HIGH",
                projectID: 1,
                createdAt: "2026-01-01",
                updatedAt: "2026-01-02",
                sprint: 1,
            },
        ];
        render(
            <DeveloperSprintHoursChart
                backendTasks={mockTasks}
                developerId="1"
            />
        );
        const chartTitle = screen.getByTestId("DevSprHr-Sprint");
        expect(chartTitle).toHaveTextContent("Sprint 1");
        const workedHours = screen.getByTestId("DevSprHr-Hours");
        expect(workedHours).toHaveTextContent("8h");
    });

});