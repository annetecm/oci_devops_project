// @vitest-environment jsdom

import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TeamOverview from "./TeamOverview";
import '@testing-library/jest-dom';

describe("KPIs: Hours worked and tasks completed by the TEAM per week/sprint.", () => {
    test("It should display team KPI information", () => {
        render(<TeamOverview />);
        const avgTaskCompleted = screen.getByTestId("TeamOverview-AvgTaskCompleted");
        expect(avgTaskCompleted).toHaveTextContent("completed on average");
        const avgHoursWorked = screen.getByTestId("TeamOverview-AvgHoursWorked");
        expect(avgHoursWorked).toHaveTextContent("total across team");
    });

});