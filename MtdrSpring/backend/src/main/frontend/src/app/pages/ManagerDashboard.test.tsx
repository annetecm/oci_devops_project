// @vitest-environment jsdom
import { describe, test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';

//To create a false API response and navigation (because the page needs navigation and API calls) 
import { MemoryRouter } from "react-router";

//Import the API functions to mock them
import * as taskApi from "../api/taskDataApi";

import ManagerDashboard from "./ManagerDashboard";

describe("KPIs: Hours worked and tasks completed by the TEAM per week/sprint.", () => {
    test("It should display average completed tasks and hours worked per sprint", async () => {
        //spies on the taskApi object, more specifically fetchTasks and fetchDeveloperSummaries
        //this allwos us to mock the response of the API call
        //mockResolvedValue returns the solved promise
        vi.spyOn(taskApi, "fetchTasks").mockResolvedValue([
            {
                taskID: 1,
                name: "Fix Login",
                description: "Bug fix",
                status: "closed",
                taskType: "bug",
                startDate: "2026-01-01",
                deadline: "2026-01-05",
                developerID: 1,
                estimatedTime: 5,
                timeSpent: 4,
                priority: "HIGH",
                projectID: 1,
                createdAt: "2026-01-01",
                updatedAt: "2026-01-01",
                sprint: 0
            },
            {
                taskID: 2,
                name: "Fix Login",
                description: "Bug fix",
                status: "closed",
                taskType: "bug",
                startDate: "2026-01-01",
                deadline: "2026-01-05",
                developerID: 2,
                estimatedTime: 5,
                timeSpent: 10,
                priority: "HIGH",
                projectID: 1,
                createdAt: "2026-01-01",
                updatedAt: "2026-01-01",
                sprint: 0
            },
            {
                taskID: 3,
                name: "Fix Login",
                description: "Bug fix",
                status: "closed",
                taskType: "bug",
                startDate: "2026-01-01",
                deadline: "2026-01-05",
                developerID: 3,
                estimatedTime: 5,
                timeSpent: 8,
                priority: "HIGH",
                projectID: 1,
                createdAt: "2026-01-01",
                updatedAt: "2026-01-01",
                sprint: 0
            }
        ]);

        vi.spyOn(taskApi, "fetchDeveloperSummaries").mockResolvedValue([
            {
                id: "1",
                name: "Hector",
                initials: "HA"
            },
            {
                id: "2",
                name: "Monse",
                initials: "MS"
            },
            {
                id: "3",
                name: "Annete",
                initials: "AM"
            }
        ]);

        render(
            //ManagerDashboard knows to use the vi.spyOn functions
            //given that these functions "overwrite" the original functions in the API file
            <MemoryRouter>
                <ManagerDashboard />
            </MemoryRouter>
        );

        await waitFor(() => {
            //We expect the average tasks to be 1.0 because we have 3 tasks and 3 workers
            //We expect the average hours to be 7.? because we have 22 hours worked in total 
            const avgTasks = screen.getByTestId('ManagerDashboard-TeamAvgasks');
            expect(avgTasks).toHaveTextContent("Team avg: 1");
            const avgHours = screen.getByTestId('ManagerDashboard-TeamAvgHours');
            expect(avgHours).toHaveTextContent("Team avg: 7");
        });
    });

});