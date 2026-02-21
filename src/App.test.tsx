/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Route } from "./routes/index";

describe("App", () => {
	it("renders correctly", () => {
		const Component = Route.options.component;
		if (!Component) throw new Error("Component not found");
		render(<Component />);
		expect(screen.getByText(/React/)).toBeInTheDocument();
		expect(screen.getByText(/Under the Hood/)).toBeInTheDocument();
	});
});
