// @vitest-environment jsdom

import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TaskCard from "./TaskCard";
import '@testing-library/jest-dom';

describe("State changes for task data (e.g., task name, developer name, Story Points, estimated hours)", () => {
    test("It should update task information when task data changes", () => {
        const originalTask = {
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
        };
        const { rerender } = render(
            <TaskCard
                task={originalTask}
            />
        );
        const taskTitle = screen.getByTestId("TaskCard-Title");
        expect(taskTitle).toHaveTextContent("Fix Login Bug");

        const updatedTask = {
            ...originalTask,
            title: "Fix Authentication System"
        };
        rerender(
            <TaskCard
                task={updatedTask}
            />
        );
        const updatedTaskTitle = screen.getByTestId("TaskCard-Title");
        expect(updatedTaskTitle).toHaveTextContent("Fix Authentication System");
        expect(updatedTaskTitle).not.toHaveTextContent("Fix Login Bug");
    });

});