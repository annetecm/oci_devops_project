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
            {
                taskID: 2,
                name: "Fix frontend",
                description: "Fix visualization issue",
                status: "closed",
                taskType: "bug",
                startDate: "2026-01-01",
                deadline: "2026-01-10",
                developerID: 1,
                estimatedTime: 5,
                timeSpent: 7,
                priority: "HIGH",
                projectID: 1,
                createdAt: "2026-01-01",
                updatedAt: "2026-01-02",
                sprint: 1,
            },
            {
                taskID: 3,
                name: "Fix backend",
                description: "Fix API connections",
                status: "closed",
                taskType: "bug",
                startDate: "2026-01-01",
                deadline: "2026-01-10",
                developerID: 1,
                estimatedTime: 5,
                timeSpent: 5,
                priority: "HIGH",
                projectID: 1,
                createdAt: "2026-01-01",
                updatedAt: "2026-01-02",
                sprint: 2,
            }
        ];
        render(
            <DeveloperSprintHoursChart
                backendTasks={mockTasks}
                developerId="1"
            />
        );
        //[0] represents "Sprint 1"
        const chartTitle1 = screen.getAllByTestId("DevSprHr-Sprint");
        expect(chartTitle1[0]).toHaveTextContent("Sprint 1");
        const workedHours1 = screen.getAllByTestId("DevSprHr-Hours");
        expect(workedHours1[0]).toHaveTextContent("15h");

        //[1] represents "Sprint 2"
        const chartTitle2 = screen.getAllByTestId("DevSprHr-Sprint");
        expect(chartTitle2[1]).toHaveTextContent("Sprint 2");
        const workedHours2 = screen.getAllByTestId("DevSprHr-Hours");
        expect(workedHours2[1]).toHaveTextContent("5h");
    });

});