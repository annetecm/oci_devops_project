// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import '@testing-library/jest-dom';

//Use to simulate a serie of events, such as clcikks
import userEvent from "@testing-library/user-event";

import { MemoryRouter, Routes, Route } from "react-router";

import * as taskApi from "../api/taskDataApi";
import TaskDetailView from "./TaskDetailView";

describe("Ability to mark a task as completed", () => {
    test("Should update task status to done", async () => {
        vi.spyOn(taskApi, "fetchTaskById").mockResolvedValue({
            taskID: 1,
            name: "Fix Login",
            description: "Bug fix",
            status: "in_progress",
            taskType: "bug",
            startDate: "2026-01-01",
            deadline: "2026-01-05",
            developerID: 1,
            estimatedTime: 5,
            timeSpent: 0,
            priority: "HIGH",
            projectID: 1,
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
            sprint: 0
        });

        vi.spyOn(taskApi, "fetchDeveloperSummaries").mockResolvedValue([
            {
                id: "1",
                name: "Hector",
                initials: "HA"
            }
        ]);

        const updateSpy = vi.spyOn(taskApi, "updateTask")
            .mockResolvedValue({
                taskID: 1,
                name: "Fix Login Closed",
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
            });

        render(
            //This requires Routes/Route, given that it must have params to function properly
            //The initialEntries is used to simulate the URL, 
            //it also allows the Route to extract the taskId param 
            <MemoryRouter initialEntries={["/task/1"]}>
                <Routes>
                    <Route path="/task/:taskId" element={<TaskDetailView />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            const taskTitle = screen.getByTestId("TaskDetailView-Title");
            expect(taskTitle).toHaveTextContent("Fix Login");
        });

        //TaskDetailView-Edit-SaveButton is a dynamic button
        //It starts as "Edit" and then changes to "Save" when we click it
        await userEvent.click(screen.getByTestId("TaskDetailView-Edit-SaveButton"));
        await userEvent.click(screen.getByTestId("TaskDetailView-Edit-SaveButton"));

        expect(updateSpy).toHaveBeenCalled();

        await waitFor(() => {
            const taskTitle = screen.getByTestId("TaskDetailView-Title");
            expect(taskTitle).toHaveTextContent("Fix Login");
        });
    });
});