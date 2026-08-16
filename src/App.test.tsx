/// <reference types="@testing-library/jest-dom/vitest" />
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routeTree } from "./routeTree.gen";

describe("App", () => {
	it("renders correctly", async () => {
		const router = createRouter({
			routeTree,
			history: createMemoryHistory({ initialEntries: ["/"] }),
		});
		render(<RouterProvider router={router} />);
		expect((await screen.findAllByText(/React/)).length).toBeGreaterThan(0);
		expect(
			(await screen.findAllByText(/Under the Hood/)).length,
		).toBeGreaterThan(0);
	});
});
