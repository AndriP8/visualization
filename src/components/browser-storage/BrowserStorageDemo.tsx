import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import {
	STORAGE_APIS,
	type StorageApiSpec,
	survivesEvent,
} from "./storageModel";

type Scenario = "reload" | "new-tab" | "restart";

const SCENARIOS: { id: Scenario; label: string }[] = [
	{ id: "reload", label: "Reload this tab" },
	{ id: "new-tab", label: "Open another tab" },
	{ id: "restart", label: "Restart browser" },
];

function survivalLabel(spec: StorageApiSpec, scenario: Scenario): string {
	const result = survivesEvent(spec, scenario);
	if (result === true) return "Yes";
	if (result === false) return "No";
	return result === "yes"
		? "Yes"
		: result === "no"
			? "No"
			: "Depends on expiry";
}

export function BrowserStorageDemo() {
	const [scenario, setScenario] = useState<Scenario>("reload");

	return (
		<DemoSection
			title="Demo 1: Browser storage at a glance"
			description="Compare storage by scope, access model, capacity, and what happens when the page or browser lifecycle changes."
		>
			<div className="space-y-5">
				<fieldset className="flex flex-wrap gap-2">
					<legend className="sr-only">Choose a lifecycle event</legend>
					{SCENARIOS.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => setScenario(item.id)}
							className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${scenario === item.id ? "border-orange-500/40 bg-orange-500/10 text-orange-300" : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"}`}
						>
							{item.label}
						</button>
					))}
				</fieldset>

				<div className="overflow-x-auto rounded-lg border border-zinc-800">
					<table className="w-full min-w-[860px] text-left text-xs">
						<thead className="bg-zinc-900 text-zinc-400">
							<tr>
								{[
									"Storage",
									"Scope",
									"Access",
									"Capacity",
									"Survives event?",
									"Typical use",
								].map((heading) => (
									<th key={heading} className="px-3 py-3 font-medium">
										{heading}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{STORAGE_APIS.map((item) => {
								const survives = survivesEvent(item, scenario);
								const positive = survives === true || survives === "yes";
								const conditional = survives === "conditional";
								return (
									<tr
										key={item.id}
										className="border-t border-zinc-800/80 bg-zinc-950/40"
									>
										<td className="px-3 py-3 font-mono text-orange-300">
											{item.name}
										</td>
										<td className="px-3 py-3 text-zinc-300">{item.scope}</td>
										<td className="px-3 py-3 text-zinc-400">
											{item.access === "sync" ? "Sync" : "Async"}
										</td>
										<td className="px-3 py-3 text-zinc-400">{item.capacity}</td>
										<td
											className={`px-3 py-3 font-medium ${
												positive
													? "text-emerald-300"
													: conditional
														? "text-amber-300"
														: "text-rose-300"
											}`}
										>
											{survivalLabel(item, scenario)}
										</td>
										<td className="px-3 py-3 text-zinc-400">{item.use}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 text-xs leading-relaxed text-zinc-400">
					<strong className="text-orange-300">Scope matters:</strong> Web
					Storage, IndexedDB, and Cache API are separated by origin. Cookies
					follow domain, path, and policy rules and may be included in requests.
					Session cookies and sessionStorage end with their browser session or
					tab context; persistent cookies last until their expiry. Web Storage
					has no HttpOnly equivalent — any script running on the page can read
					its values.
				</div>
			</div>
		</DemoSection>
	);
}
