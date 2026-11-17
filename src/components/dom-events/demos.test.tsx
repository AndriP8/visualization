/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CustomEventDemo } from "./CustomEventDemo";
import { EventDelegationDemo } from "./EventDelegationDemo";
import { ListenerOptionsDemo } from "./ListenerOptionsDemo";
import { NonBubblingDemo } from "./NonBubblingDemo";
import { ReactVsNativeDemo } from "./ReactVsNativeDemo";

describe("NonBubblingDemo", () => {
	it("only receives the bubbling focus events on the delegated listener", async () => {
		const user = userEvent.setup();
		const { container } = render(<NonBubblingDemo />);

		await user.click(screen.getByLabelText("Name"));

		const entries = Array.from(container.querySelectorAll("ol li")).map(
			(item) => item.textContent,
		);
		expect(entries).toEqual(["focusin"]);
	});
});

describe("ListenerOptionsDemo", () => {
	it("runs the handler once when the once option is selected", async () => {
		const user = userEvent.setup();
		render(<ListenerOptionsDemo />);

		const button = screen.getByRole("button", { name: "Click me" });
		await user.click(button);
		await user.click(button);

		expect(screen.getByText(/Handler ran/)).toHaveTextContent("1 time");
	});

	it("runs the handler every time when the passive option is selected", async () => {
		const user = userEvent.setup();
		render(<ListenerOptionsDemo />);

		await user.click(screen.getByRole("button", { name: "passive" }));
		const button = screen.getByRole("button", { name: "Click me" });
		await user.click(button);
		await user.click(button);

		expect(screen.getByText(/Handler ran/)).toHaveTextContent("2 times");
	});

	it("stops the handler after the controller is aborted", async () => {
		const user = userEvent.setup();
		render(<ListenerOptionsDemo />);

		await user.click(screen.getByRole("button", { name: "signal" }));
		const button = screen.getByRole("button", { name: "Click me" });
		await user.click(button);
		await user.click(
			screen.getByRole("button", { name: "controller.abort()" }),
		);
		await user.click(button);

		expect(screen.getByText(/Handler ran/)).toHaveTextContent("1 time");
	});
});

describe("EventDelegationDemo", () => {
	it("keeps one listener while the row count grows", async () => {
		const user = userEvent.setup();
		render(<EventDelegationDemo />);

		await user.click(screen.getByRole("button", { name: /Add item/ }));
		await user.click(screen.getByRole("button", { name: /Add item/ }));

		expect(screen.getByText("1 listener")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
		expect(screen.getByText(/listeners for 5 rows/)).toBeInTheDocument();
	});

	it("selects the same row whether the icon or the label is clicked", async () => {
		const user = userEvent.setup();
		const { container } = render(<EventDelegationDemo />);

		const row = container.querySelector("[data-item]") as HTMLElement;
		const icon = row.querySelector("span") as HTMLElement;

		const result = screen
			.getByText("Listener result")
			.parentElement?.querySelector(".text-lg") as HTMLElement;

		await user.click(icon);
		expect(result).toHaveTextContent("Inbox");
		expect(screen.getByText(/event\.target:/)).toHaveTextContent("span");

		await user.click(row);
		expect(result).toHaveTextContent("Inbox");
		expect(screen.getByText(/event\.target:/)).toHaveTextContent("button");
	});
});

describe("CustomEventDemo", () => {
	const clickWidget = async (container: HTMLElement) => {
		const widget = container.querySelector("cart-widget");
		expect(widget).toBeInTheDocument();
		const innerButton = widget?.querySelector("button") as HTMLElement;
		await userEvent.setup().click(innerButton);
	};

	const listeners = (container: HTMLElement): string[] =>
		Array.from(container.querySelectorAll("ol")).map((list) =>
			Array.from(list.querySelectorAll("li"))
				.map((li) => li.textContent)
				.join(","),
		);

	const listCount = (container: HTMLElement): number =>
		container.querySelectorAll("ol").length;

	it("delivers the event to both ancestors when bubbles is on", async () => {
		const { container } = render(<CustomEventDemo />);
		await clickWidget(container);

		// First list is "who received", second is "items received".
		expect(listeners(container)[0]).toBe("middle,outer");
		expect(listeners(container)[1]).toBe("Latte #1");
	});

	it("stops the event at the sender when bubbles is off", async () => {
		const user = userEvent.setup();
		const { container } = render(<CustomEventDemo />);

		await user.click(screen.getByRole("checkbox", { name: "bubbles" }));
		await clickWidget(container);

		// Both panels fall back to their empty state, so no list is rendered.
		expect(listCount(container)).toBe(0);
		expect(screen.getByText("Nothing yet.")).toBeInTheDocument();
	});
});

describe("ReactVsNativeDemo", () => {
	const traceEntries = (container: HTMLElement): string[] =>
		Array.from(container.querySelectorAll("ol li")).map(
			(item) => item.textContent ?? "",
		);

	const target = (container: HTMLElement): HTMLElement =>
		container.querySelector("#react-native-target") as HTMLElement;

	it("runs React capture handlers before native ones", async () => {
		const user = userEvent.setup();
		const { container } = render(<ReactVsNativeDemo />);

		await user.click(target(container));

		const entries = traceEntries(container);
		expect(entries).toEqual([
			"React capture mid",
			"React capture target",
			"native capture mid",
			"native bubble mid",
			"React bubble target",
			"React bubble mid",
		]);
	});

	it("drops the React bubble handlers when a native listener stops propagation", async () => {
		const user = userEvent.setup();
		const { container } = render(<ReactVsNativeDemo />);

		await user.click(screen.getByRole("checkbox", { name: /stopPropagation/ }));
		await user.click(target(container));

		const entries = traceEntries(container);
		expect(entries).toEqual([
			"React capture mid",
			"React capture target",
			"native capture mid",
			"native bubble mid",
		]);
		expect(entries).not.toContain("React bubble target");
	});
});
