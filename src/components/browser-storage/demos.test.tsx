/// <reference types="@testing-library/jest-dom/vitest" />
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { BrowserStorageDemo } from "./BrowserStorageDemo";
import { CacheApiDemo } from "./CacheApiDemo";
import { CookieScopeDemo } from "./CookieScopeDemo";
import { IndexedDbSchemaDemo } from "./IndexedDbSchemaDemo";
import { LiveStorageDemo } from "./LiveStorageDemo";
import { PartitioningDemo } from "./PartitioningDemo";
import { QuotaEvictionDemo } from "./QuotaEvictionDemo";
import { StorageDecisionTreeDemo } from "./StorageDecisionTreeDemo";
import { StorageEventDemo } from "./StorageEventDemo";

function createMemoryStorage(): Storage {
	const data = new Map<string, string>();
	return {
		get length() {
			return data.size;
		},
		clear: () => data.clear(),
		getItem: (key) => data.get(key) ?? null,
		key: (index) => Array.from(data.keys())[index] ?? null,
		removeItem: (key) => {
			data.delete(key);
		},
		setItem: (key, value) => {
			data.set(key, value);
		},
	};
}

// Node 26 exposes an experimental localStorage getter that returns undefined,
// so jsdom's implementation never lands on the global. Install real Storage
// objects for the demos that read them.
beforeEach(() => {
	Object.defineProperty(window, "localStorage", {
		configurable: true,
		value: createMemoryStorage(),
	});
	Object.defineProperty(window, "sessionStorage", {
		configurable: true,
		value: createMemoryStorage(),
	});
});

describe("BrowserStorageDemo", () => {
	it("marks sessionStorage as not surviving a new tab", async () => {
		const user = userEvent.setup();
		render(<BrowserStorageDemo />);

		await user.click(screen.getByRole("button", { name: "Open another tab" }));

		const rows = screen.getAllByRole("row");
		const sessionRow = rows.find((row) =>
			row.textContent?.includes("sessionStorage"),
		);
		expect(sessionRow).toHaveTextContent("No");
	});

	it("shows cookie survival as dependent on expiry after a restart", async () => {
		const user = userEvent.setup();
		render(<BrowserStorageDemo />);

		await user.click(screen.getByRole("button", { name: "Restart browser" }));

		const rows = screen.getAllByRole("row");
		const cookieRow = rows.find((row) => row.textContent?.includes("Cookie"));
		expect(cookieRow).toHaveTextContent("Depends on expiry");
	});
});

describe("CookieScopeDemo", () => {
	it("withholds the host-only cookie from a subdomain request", async () => {
		const user = userEvent.setup();
		render(<CookieScopeDemo />);

		expect(screen.getAllByText(/host-only; Path=\//).length).toBeGreaterThan(0);

		await user.click(screen.getByRole("button", { name: "Subdomain request" }));

		const withheld = screen.getAllByText("Withheld");
		expect(withheld.length).toBeGreaterThan(0);
	});

	it("reports the lifetime when a Max-Age option is picked", async () => {
		const user = userEvent.setup();
		render(<CookieScopeDemo />);

		await user.click(screen.getByRole("button", { name: "1 hour" }));
		expect(screen.getByText(/for 1 hour/)).toBeInTheDocument();
	});
});

describe("PartitioningDemo", () => {
	it("blocks an unpartitioned cookie in a third-party context", async () => {
		const user = userEvent.setup();
		render(<PartitioningDemo />);

		await user.click(
			screen.getByRole("button", { name: "Embedded in another site" }),
		);

		expect(screen.getByText("Not sent")).toBeInTheDocument();
		expect(screen.getByText(/not sent here/i)).toBeInTheDocument();
	});

	it("shows a partitioned cookie as sent but isolated", async () => {
		const user = userEvent.setup();
		render(<PartitioningDemo />);

		await user.click(
			screen.getByRole("button", { name: "Embedded with Partitioned" }),
		);

		expect(screen.getByText("Sent, but isolated")).toBeInTheDocument();
	});
});

describe("QuotaEvictionDemo", () => {
	it("reports the Safari seven-day cap once the idle slider passes it", async () => {
		render(<QuotaEvictionDemo />);

		const slider = screen.getByRole("slider", {
			name: /Days since the user interacted/i,
		});
		fireEvent.change(slider, { target: { value: "9" } });

		expect(
			await screen.findByText(/seven-day cap has passed/i),
		).toBeInTheDocument();
	});
});

describe("StorageDecisionTreeDemo", () => {
	it("recommends the Cache API when caching responses for offline use", async () => {
		const user = userEvent.setup();
		render(<StorageDecisionTreeDemo />);

		await user.click(screen.getByRole("button", { name: /Yes/ }));

		expect(await screen.findByText("Cache API")).toBeInTheDocument();
		expect(screen.getByText(/App shell for offline use/)).toBeInTheDocument();
	});

	it("recommends a cookie when the server must read the value", async () => {
		const user = userEvent.setup();
		render(<StorageDecisionTreeDemo />);

		await user.click(screen.getByRole("button", { name: /No/ }));
		await screen.findByText(/Does the server need to read/i);
		await user.click(screen.getByRole("button", { name: /Yes/ }));

		expect(await screen.findByText(/Session identifiers/)).toBeInTheDocument();
	});

	it("recommends sessionStorage for per-tab data that need not survive closing", async () => {
		const user = userEvent.setup();
		render(<StorageDecisionTreeDemo />);

		await user.click(screen.getByRole("button", { name: /No/ })); // not offline
		await screen.findByText(/Does the server need to read/i);
		await user.click(screen.getByRole("button", { name: /No/ })); // server does not read
		await screen.findByText(/Is the data structured/i);
		await user.click(screen.getByRole("button", { name: /No/ })); // small + unstructured
		await screen.findByText(/survive when the tab is closed/i);
		await user.click(screen.getByRole("button", { name: /No/ })); // does not survive

		expect(await screen.findByText(/One-off wizard state/)).toBeInTheDocument();
	});
});

describe("LiveStorageDemo", () => {
	it("writes a real localStorage value and reports it", async () => {
		const user = userEvent.setup();
		render(<LiveStorageDemo />);

		await user.click(screen.getByRole("button", { name: "Write a value" }));

		expect(window.localStorage.getItem("under-the-hood-demo")).toContain(
			"theme=dark",
		);
		expect(
			await screen.findByText(/stored a string value/i),
		).toBeInTheDocument();
	});

	it("degrades gracefully when IndexedDB is unavailable", async () => {
		const user = userEvent.setup();
		render(<LiveStorageDemo />);

		await user.click(screen.getByRole("button", { name: "indexedDB" }));

		expect(
			await screen.findByText(/does not expose IndexedDB/i),
		).toBeInTheDocument();
	});
});

describe("StorageEventDemo", () => {
	it("writes to localStorage when the write button is used", async () => {
		const user = userEvent.setup();
		render(<StorageEventDemo />);

		await user.click(screen.getByRole("button", { name: "Write a value" }));

		expect(window.localStorage.getItem("under-the-hood-cross-tab")).toMatch(
			/^v-\d+$/,
		);
	});

	it("shows the empty state before anything is written", () => {
		render(<StorageEventDemo />);
		expect(screen.getByText("Nothing stored yet.")).toBeInTheDocument();
	});
});

describe("CacheApiDemo", () => {
	it("explains that the Cache API is unavailable instead of crashing", async () => {
		render(<CacheApiDemo />);

		expect(
			await screen.findByText(/does not expose the Cache API/i),
		).toBeInTheDocument();
	});
});

describe("IndexedDbSchemaDemo", () => {
	it("changes the code sample when a different step is picked", async () => {
		const user = userEvent.setup();
		const { container } = render(<IndexedDbSchemaDemo />);

		expect(container.textContent).toContain("by-name");
		expect(container.textContent).not.toContain("by-email");
		expect(container.textContent).not.toContain("VersionError");

		await user.click(screen.getByRole("button", { name: /Upgrade/ }));

		expect(container.textContent).toContain("by-email");
		expect(container.textContent).toContain("oldVersion");

		await user.click(screen.getByRole("button", { name: /Open v1 again/ }));

		expect(container.textContent).toContain("VersionError");
		expect(container.textContent).not.toContain("by-email");
	});
});
