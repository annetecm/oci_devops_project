// @vitest-environment jsdom
import { describe, test, expect } from "vitest";
import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import Header from "./Header";
import '@testing-library/jest-dom';

describe("Customized dashboard based on the worker's role", () => {
    test("It should display developer dashboard title", () => {
       render(
            <MemoryRouter>
                <Header
                    title="Developer Dashboard"
                    subtitle="Tasks assigned"
                    userName="Hector"
                    userInitials="HA"
                />
            </MemoryRouter>
        );
        const dashboardTitle = screen.getByTestId('Header-Role');
        expect(dashboardTitle).toHaveTextContent("Developer Dashboard");
    });
});