import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

interface VersionStep {
	id: string;
	label: string;
	call: string;
	title: string;
	detail: string;
	trigger: "onupgradeneeded" | "error";
	code: string;
}

const VERSION_STEPS: VersionStep[] = [
	{
		id: "install",
		label: "Fresh install → v1",
		call: 'indexedDB.open("app-db", 1)',
		title: "Create the database",
		detail:
			"Nothing exists yet, so the upgrade handler creates the object store and adds the first index.",
		trigger: "onupgradeneeded",
		code: `const request = indexedDB.open("app-db", 1);

request.onupgradeneeded = () => {
  const db = request.result;

  // Nothing exists yet, so build the store from scratch.
  const store = db.createObjectStore("users", { keyPath: "id" });
  store.createIndex("by-name", "name");
};`,
	},
	{
		id: "upgrade",
		label: "Upgrade → v2",
		call: 'indexedDB.open("app-db", 2)',
		title: "Add a new index",
		detail:
			"The store already exists, so the handler has to check for it and extend it instead of recreating it.",
		trigger: "onupgradeneeded",
		code: `const request = indexedDB.open("app-db", 2);

request.onupgradeneeded = (event) => {
  const db = request.result;
  const tx = request.transaction;

  if (!db.objectStoreNames.contains("users")) {
    const store = db.createObjectStore("users", { keyPath: "id" });
    store.createIndex("by-name", "name");
  } else if (event.oldVersion < 2) {
    // The store exists — extend it, do not recreate it.
    tx.objectStore("users").createIndex("by-email", "email");
  }
};`,
	},
	{
		id: "downgrade",
		label: "Open v1 again",
		call: 'indexedDB.open("app-db", 1)',
		title: "Opening a lower version fails",
		detail:
			"The database is already at version 2. Asking for version 1 is a downgrade, which the browser refuses. The upgrade handler never runs, and you get a VersionError instead.",
		trigger: "error",
		code: `// The database is already at version 2.
const request = indexedDB.open("app-db", 1);

// onupgradeneeded does NOT run for a lower version.
request.onerror = () => {
  console.error(request.error?.name); // "VersionError"
};`,
	},
];

export function IndexedDbSchemaDemo() {
	const [index, setIndex] = useState(0);
	const step = VERSION_STEPS[index];

	return (
		<DemoSection
			title="Demo 7: IndexedDB schema evolution"
			description="The shape of a database can only change inside an upgrade transaction. Click through the steps and the code below changes with each one."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap gap-2">
					{VERSION_STEPS.map((item, itemIndex) => (
						<button
							key={item.id}
							type="button"
							onClick={() => setIndex(itemIndex)}
							aria-pressed={index === itemIndex}
							className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
								index === itemIndex
									? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
									: "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
							}`}
						>
							{item.label}
						</button>
					))}
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<div className="flex items-center justify-between gap-3">
						<span className="font-mono text-xs text-zinc-300">{step.call}</span>
						<span
							className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
								step.trigger === "error"
									? "bg-rose-500/15 text-rose-300"
									: "bg-cyan-500/15 text-cyan-300"
							}`}
						>
							{step.trigger}
						</span>
					</div>
					<p className="mt-3 text-sm text-zinc-200">{step.title}</p>
					<p className="mt-1 text-xs leading-relaxed text-zinc-400">
						{step.detail}
					</p>
				</div>

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={step.code}
				/>

				<div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs leading-relaxed text-zinc-400">
					<strong className="text-cyan-300">The footgun:</strong> calling{" "}
					<code className="font-mono text-zinc-200">createObjectStore</code> for
					a store that already exists throws. The upgrade handler has to check
					what is already there first, as the second step shows. There is no
					built-in migration framework, so teams write their own version checks.
				</div>
			</div>
		</DemoSection>
	);
}
