// @vitest-environment jsdom

import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import KanbanBoard from "./KanbanBoard";
import '@testing-library/jest-dom';

describe("Real-time display of tasks assigned to each user & Ability to mark a task as completed", () => {
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
                onTaskClick={vi.fn()}
            />
        );
        const taskTitle = screen.getAllByTestId("KanbanBoard-Name");
        expect(taskTitle[0]).toHaveTextContent("Fix Login Bug");
    });

    test("It should move a task to completed column", () => {
        const mockTask = {
            id: "1",
            title: "Fix Login Bug",
            description: "Fix authentication issue",
            status: "in-progress",
            priority: "high",
            dueDate: "2026-12-31",
            tags: ["bug"],
            assignedDeveloper: {
                name: "Hector"
            }
        };
        const { rerender } = render(
            <KanbanBoard
                tasks={[mockTask]}
                onTaskClick={vi.fn()}
            />
        );
        //[1] is the "in progress" index
        const taskStatus = screen.getAllByTestId('KanbanBoard-Status');
        expect(taskStatus[1]).toHaveTextContent("In Progress");
        const taskTitle = screen.getAllByTestId("KanbanBoard-Name");
        expect(taskTitle[1]).toHaveTextContent("Fix Login Bug");

        const completedTask = {
            ...mockTask,
            status: "done"
        };

        rerender(
            <KanbanBoard
                tasks={[completedTask]}
                onTaskClick={vi.fn()}
            />
        );

        //[2] is the "done" index
        const updatedTaskStatus = screen.getAllByTestId('KanbanBoard-Status');
        expect(updatedTaskStatus[2]).toHaveTextContent("Done");
        const updatedTaskTitle = screen.getAllByTestId("KanbanBoard-Name");
        expect(updatedTaskTitle[2]).toHaveTextContent("Fix Login Bug");
        expect(taskTitle[1]).not.toHaveTextContent("Fix Login Bug");
    });
});