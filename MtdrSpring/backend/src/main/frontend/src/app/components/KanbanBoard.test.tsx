// @vitest-environment jsdom

import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import KanbanBoard from "./KanbanBoard";
import '@testing-library/jest-dom';

describe("Real-time display of tasks assigned to each user", () => {
    test("It should display assigned tasks in the board", () => {
        const mockTasks = [
            {
                id: "1",
                title: "Fix Login Bug",
                description: "Fix authentication issue",
                status: "todo",
                priority: "high",
                dueDate: "2026-12-31",
                tags: ["bug"],
                assignedDeveloper: {
                    name: "Hector"
                }
            }
        ];
        render(
            <KanbanBoard
                tasks={mockTasks}
            />
        );
        const taskTitle = screen.getAllByTestId("KanbanBoard-Name");
        expect(taskTitle[0]).toHaveTextContent("Fix Login Bug");
    });
});