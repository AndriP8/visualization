import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Pressure = "none" | "mild" | "heavy";

const PRESSURE_LEVELS: { id: Pressure; label: string; usage: number }[] = [
	{ id: "none", label: "No pressure", usage: 30 },
	{ id: "mild", label: "Pressure", usage: 88 },
	{ id: "heavy", label: "Heavy pressure", usage: 97 },
];

const EVICTION_TARGETS = [
	"localStorage",
	"sessionStorage",
	"IndexedDB",
	"Cache API",
] as const;

export function QuotaEvictionDemo() {
	const [usage, setUsage] = useState(68);
	const [persistent, setPersistent] = useState(false);
	const [message, setMessage] = useState(
		"Adjust usage or simulate storage pressure.",
	);
	const [daysIdle, setDaysIdle] = useState(0);

	const simulatePressure = () => {
		if (persistent) {
			setMessage(
				"Persistent storage is less likely to be automatically evicted; the user can still clear it.",
			);
			return;
		}
		setUsage(0);
		setMessage(
			"Best-effort origin data was evicted under simulated storage pressure.",
		);
	};

	const applyPressure = (id: Pressure) => {
		const level = PRESSURE_LEVELS.find((item) => item.id === id);
		if (!level) return;
		setUsage(level.usage);
		if (level.id === "none") {
			setMessage("Usage is comfortable. Nothing is under pressure.");
			return;
		}
		setMessage(
			persistent
				? "Pressure exists, but persistent storage resists automatic eviction."
				: "Under pressure the browser starts removing best-effort data.",
		);
	};

	const itpExpired = daysIdle >= 7;

	return (
		<DemoSection
			title="Demo 10: Quota, persistence and eviction"
			description="Browser storage quotas are dynamic. Best-effort data can be evicted under pressure, and Safari also deletes script-written data after seven days of inactivity."
		>
			<div className="space-y-5">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<div className="flex items-center justify-between text-xs text-zinc-500">
							<span>Origin storage estimate</span>
							<span>{usage}% used</span>
						</div>
						<div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-800">
							<div
								className={`h-full transition-all ${usage > 85 ? "bg-rose-400" : "bg-cyan-400"}`}
								style={{ width: `${usage}%` }}
							/>
						</div>
						<label className="mt-4 block text-xs text-zinc-400">
							Simulated usage
							<input
								type="range"
								min="0"
								max="100"
								value={usage}
								aria-label="Simulated usage"
								onChange={(event) => setUsage(Number(event.target.value))}
								className="mt-2 w-full accent-cyan-400"
							/>
						</label>
						<div className="mt-3 flex flex-wrap gap-2">
							{PRESSURE_LEVELS.map((level) => (
								<button
									key={level.id}
									type="button"
									onClick={() => applyPressure(level.id)}
									className="rounded-lg border border-zinc-800 px-3 py-2 text-[11px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
								>
									{level.label}
								</button>
							))}
						</div>
						<div className="mt-3 flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => {
									setPersistent(true);
									setMessage(
										"Persistence granted in this simulation. Automatic eviction risk is reduced.",
									);
								}}
								className={`rounded-lg border px-3 py-2 text-xs ${persistent ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"}`}
							>
								{persistent ? "✓ Persistent granted" : "Request persistence"}
							</button>
							<button
								type="button"
								onClick={simulatePressure}
								className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
							>
								Simulate pressure
							</button>
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
							<p className="text-sm text-zinc-300" aria-live="polite">
								{message}
							</p>
						</div>

						<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
							<div className="flex items-center justify-between text-xs text-zinc-500">
								<span>Days since the user interacted with the site</span>
								<span className="text-zinc-300">{daysIdle} days</span>
							</div>
							<input
								type="range"
								min="0"
								max="14"
								value={daysIdle}
								aria-label="Days since the user interacted with the site"
								onChange={(event) => setDaysIdle(Number(event.target.value))}
								className="mt-2 w-full accent-amber-400"
							/>
							<div
								className={`mt-2 rounded-md border px-2 py-1.5 text-[11px] ${
									itpExpired
										? "border-amber-500/25 bg-amber-500/5 text-amber-300"
										: "border-zinc-800 text-zinc-500"
								}`}
							>
								{itpExpired
									? "Safari's seven-day cap has passed. Script-written storage for this origin is deleted."
									: `Script-written storage is still kept. The seven-day cap applies after 7 days without interaction.`}
							</div>
						</div>
					</div>
				</div>

				{itpExpired ? (
					<div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
						<div className="text-xs uppercase tracking-wider text-amber-300">
							Deleted by the seven-day cap
						</div>
						<div className="mt-2 flex flex-wrap gap-2">
							{EVICTION_TARGETS.map((target) => (
								<span
									key={target}
									className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 font-mono text-[11px] text-amber-200 line-through"
								>
									{target}
								</span>
							))}
						</div>
						<p className="mt-3 text-xs leading-relaxed text-zinc-400">
							Safari&apos;s Intelligent Tracking Prevention deletes everything a
							page writes through JavaScript once the user has not interacted
							with the site for seven days. That includes{" "}
							<code className="font-mono text-zinc-300">localStorage</code>,{" "}
							<code className="font-mono text-zinc-300">IndexedDB</code>, the
							Cache API, and cookies set through{" "}
							<code className="font-mono text-zinc-300">document.cookie</code>.
							A cookie that the server set with an explicit expiry follows a
							different, longer schedule, which is why a server-side recovery
							path often still works when the client-side data is gone.
						</p>
					</div>
				) : null}

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`const { usage, quota } = await navigator.storage.estimate();
const persisted = await navigator.storage.persist();
console.log({ usage, quota, persisted });

// IndexedDB reports the same limit as a QuotaExceededError
// when a write goes past it. Catch it and tell the user.`}
				/>

				<p className="text-xs text-zinc-500">
					This is a conceptual model, not a fixed quota. Available space and
					eviction policies vary by browser and device; persistence requests can
					be denied. The pressure slider shows the best-effort eviction path,
					and the days slider shows the time-based path, which no quota setting
					can prevent.
				</p>
			</div>
		</DemoSection>
	);
}
