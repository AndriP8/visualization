import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Operation = "read" | "write";

const READ_STEPS = [
	"Open a readonly transaction",
	"Get record with key 7",
	"Request succeeds with { id: 7, name: 'Ada' }",
	"Transaction completes",
];

const WRITE_STEPS = [
	"Open a readwrite transaction",
	"Put updated record with key 7",
	"Request succeeds; change is still pending",
	"Transaction completes and commits",
];

export function IndexedDbFlowDemo() {
	const [operation, setOperation] = useState<Operation>("read");
	const [step, setStep] = useState(-1);
	const [name, setName] = useState("Ada");
	const steps = operation === "read" ? READ_STEPS : WRITE_STEPS;

	const run = (nextOperation: Operation) => {
		setOperation(nextOperation);
		setStep(0);
		if (nextOperation === "write") setName("Ada Lovelace");
	};

	return (
		<DemoSection
			title="Demo 6: IndexedDB transactions"
			description="IndexedDB stores structured records asynchronously. Requests run inside a transaction, and a successful request is not the same as a committed transaction."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => run("read")}
						className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300"
					>
						Read record
					</button>
					<button
						type="button"
						onClick={() => run("write")}
						className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-300"
					>
						Update record
					</button>
					<button
						type="button"
						onClick={() =>
							setStep((current) => Math.min(current + 1, steps.length - 1))
						}
						disabled={step < 0 || step >= steps.length - 1}
						className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 disabled:opacity-40"
					>
						Next transaction step
					</button>
				</div>
				<div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<div className="font-mono text-xs text-zinc-500">
							Database: app-db v2
						</div>
						<div className="mt-3 rounded-md border border-cyan-500/30 bg-cyan-500/5 p-3">
							<div className="text-xs text-cyan-300">
								Object store: users · keyPath: id
							</div>
							<div className="mt-2 text-sm text-zinc-200">
								&#123; id: 7, name: "{name}" &#125;
							</div>
						</div>
						<div className="mt-2 text-xs text-zinc-500">Index: by-name</div>
					</div>
					<ol className="space-y-2">
						{steps.map((item, index) => (
							<li
								key={item}
								className={`flex gap-3 rounded-lg border p-3 text-xs ${index <= step ? "border-cyan-500/30 bg-cyan-500/5 text-cyan-200" : "border-zinc-800 bg-zinc-950/50 text-zinc-600"}`}
							>
								<span className="font-mono">
									{index < step ? "✓" : index === step ? "●" : "○"}
								</span>
								{item}
							</li>
						))}
					</ol>
				</div>
				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`const tx = db.transaction("users", "readwrite");
const request = tx.objectStore("users").put(user);

request.onsuccess = () => console.log("request stored");
tx.oncomplete = () => console.log("transaction committed");
tx.onabort = () => console.error("transaction rolled back");`}
				/>
				<p className="text-xs text-zinc-500">
					The controls illustrate the request/transaction sequence. Demo 2 uses
					your browser's real IndexedDB if you want to see the actual records.
					Schema changes only happen in a version-change transaction — the
					onupgradeneeded handler that fires when a database's version is bumped
					above app-db v2.
				</p>
			</div>
		</DemoSection>
	);
}
