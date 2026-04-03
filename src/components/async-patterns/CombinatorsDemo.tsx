import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type Combinator = "all" | "race" | "allSettled" | "any";

interface PromiseConfig {
	label: string;
	delay: number;
	succeeds: boolean;
}

interface RunResult {
	status: "running" | "done" | "error";
	value: string;
	settled: boolean[];
	winner?: number;
}

const COMBINATOR_DESCRIPTIONS: Record<
	Combinator,
	{ summary: string; resolves: string; rejects: string }
> = {
	all: {
		summary: "Waits for ALL promises to fulfill. Fails fast on any rejection.",
		resolves: "All fulfilled → array of results",
		rejects: "Any rejected → first rejection reason",
	},
	race: {
		summary:
			"Settles with the first promise that settles (fulfilled OR rejected).",
		resolves: "First to settle (if fulfilled)",
		rejects: "First to settle (if rejected)",
	},
	allSettled: {
		summary:
			"Waits for ALL promises to settle (never rejects). Returns status + value for each.",
		resolves: "Always → array of {status, value/reason}",
		rejects: "Never rejects",
	},
	any: {
		summary:
			"Resolves with first fulfillment. Fails only if ALL reject (AggregateError).",
		resolves: "First fulfilled value",
		rejects: "All rejected → AggregateError",
	},
};

const COMBINATOR_CODE: Record<Combinator, string> = {
	all: `const [user, posts, comments] = await Promise.all([
  fetchUser(id),
  fetchPosts(id),
  fetchComments(id),
]);
// All must succeed — one failure aborts all`,
	race: `const result = await Promise.race([
  fetchData(),
  timeout(3000),  // throw if too slow
]);
// First settled wins — use for timeouts`,
	allSettled: `const results = await Promise.allSettled([p1, p2, p3]);
results.forEach(({ status, value, reason }) => {
  if (status === 'fulfilled') use(value);
  else logError(reason);
});
// Never throws — safe for partial failures`,
	any: `const fastest = await Promise.any([
  fetchFromRegion('us'),
  fetchFromRegion('eu'),
  fetchFromRegion('ap'),
]);
// First success wins — fallback pattern`,
};

function simulate(
	promises: PromiseConfig[],
	combinator: Combinator,
	onUpdate: (result: RunResult) => void,
): void {
	const settled = [false, false, false];
	const results: Array<{ success: boolean; value: string }> = [];
	let done = false;

	onUpdate({ status: "running", value: "", settled: [false, false, false] });

	const timers = promises.map((p, i) => {
		return setTimeout(() => {
			if (done) return;
			settled[i] = true;
			results[i] = {
				success: p.succeeds,
				value: p.succeeds ? `P${i + 1} result` : `P${i + 1} error`,
			};

			const newSettled = [...settled];

			if (combinator === "race") {
				done = true;
				onUpdate({
					status: p.succeeds ? "done" : "error",
					value: results[i].value,
					settled: newSettled,
					winner: i,
				});
				return;
			}

			if (combinator === "all") {
				if (!p.succeeds) {
					done = true;
					onUpdate({
						status: "error",
						value: `Rejected: P${i + 1} error`,
						settled: newSettled,
					});
					return;
				}
				if (
					results.filter(Boolean).length === promises.length &&
					results.every((r) => r?.success)
				) {
					done = true;
					onUpdate({
						status: "done",
						value: `[${results.map((r) => r.value).join(", ")}]`,
						settled: newSettled,
					});
				} else {
					onUpdate({ status: "running", value: "", settled: newSettled });
				}
			}

			if (combinator === "allSettled") {
				onUpdate({ status: "running", value: "", settled: newSettled });
				if (newSettled.every(Boolean)) {
					const out = results
						.map((r) =>
							r.success ? `{fulfilled: ${r.value}}` : `{rejected: ${r.value}}`,
						)
						.join(", ");
					done = true;
					onUpdate({ status: "done", value: `[${out}]`, settled: newSettled });
				}
			}

			if (combinator === "any") {
				if (p.succeeds) {
					done = true;
					onUpdate({
						status: "done",
						value: results[i].value,
						settled: newSettled,
						winner: i,
					});
				} else {
					onUpdate({ status: "running", value: "", settled: newSettled });
					if (
						newSettled.every(Boolean) &&
						results.every((r) => r && !r.success)
					) {
						done = true;
						onUpdate({
							status: "error",
							value: "AggregateError: All promises rejected",
							settled: newSettled,
						});
					}
				}
			}
		}, p.delay * 1000);
	});

	// Store cleanup reference (not strictly needed in demo context)
	void timers;
}

export function CombinatorsDemo() {
	const [combinator, setCombinator] = useState<Combinator>("all");
	const [promises, setPromises] = useState<PromiseConfig[]>([
		{ label: "P1", delay: 1, succeeds: true },
		{ label: "P2", delay: 2, succeeds: true },
		{ label: "P3", delay: 1.5, succeeds: true },
	]);
	const [result, setResult] = useState<RunResult | null>(null);
	const [running, setRunning] = useState(false);

	const run = () => {
		setRunning(true);
		setResult(null);
		simulate(promises, combinator, (r) => {
			setResult(r);
			if (r.status !== "running") setRunning(false);
		});
	};

	const desc = COMBINATOR_DESCRIPTIONS[combinator];

	return (
		<div className="space-y-5">
			{/* Combinator selector */}
			<div className="flex flex-wrap gap-2">
				{(["all", "race", "allSettled", "any"] as Combinator[]).map((c) => (
					<button
						key={c}
						type="button"
						onClick={() => {
							setCombinator(c);
							setResult(null);
						}}
						className={`px-4 py-2 rounded-lg text-sm font-mono font-medium border transition-colors ${
							combinator === c
								? "bg-cyan-500/20 text-accent-cyan border-cyan-500/30"
								: "bg-surface-secondary text-text-tertiary border-border-secondary hover:text-text-secondary"
						}`}
					>
						Promise.{c}()
					</button>
				))}
			</div>

			<p className="text-sm text-text-tertiary">{desc.summary}</p>

			{/* Promise configs */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				{promises.map((p, i) => (
					<div
						key={p.label}
						className="p-3 rounded-lg bg-surface-primary border border-border-primary space-y-3"
					>
						<div className="text-sm font-semibold text-text-secondary">
							{p.label}
						</div>
						<div className="space-y-2">
							<div>
								<label
									htmlFor={`delay-${i}`}
									className="text-xs text-text-muted block mb-1"
								>
									Delay: {p.delay}s
								</label>
								<input
									id={`delay-${i}`}
									type="range"
									min={0.5}
									max={3}
									step={0.5}
									value={p.delay}
									onChange={(e) => {
										const next = [...promises];
										next[i] = { ...next[i], delay: Number(e.target.value) };
										setPromises(next);
										setResult(null);
									}}
									className="w-full accent-cyan-500"
								/>
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => {
										const next = [...promises];
										next[i] = { ...next[i], succeeds: !next[i].succeeds };
										setPromises(next);
										setResult(null);
									}}
									className={`text-xs px-2 py-1 rounded border transition-colors ${
										p.succeeds
											? "bg-emerald-500/10 text-accent-emerald-soft border-emerald-500/20"
											: "bg-rose-500/10 text-accent-rose-soft border-rose-500/20"
									}`}
								>
									{p.succeeds ? "✓ Fulfills" : "✗ Rejects"}
								</button>
							</div>
						</div>

						{/* Progress bar */}
						{result && (
							<div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
								<motion.div
									className={`h-full rounded-full ${
										result.settled[i]
											? promises[i].succeeds
												? "bg-emerald-500"
												: "bg-rose-500"
											: "bg-surface-tertiary"
									}`}
									initial={{ width: 0 }}
									animate={{ width: result.settled[i] ? "100%" : "0%" }}
									transition={{ duration: p.delay }}
								/>
							</div>
						)}
					</div>
				))}
			</div>

			{/* Run button */}
			<button
				type="button"
				onClick={run}
				disabled={running}
				className="px-5 py-2.5 rounded-lg text-sm font-medium bg-cyan-500/20 text-accent-cyan border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{running ? "Running..." : "▶ Run"}
			</button>

			{/* Result */}
			<AnimatePresence>
				{result && result.status !== "running" && (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className={`p-4 rounded-lg border text-sm font-mono ${
							result.status === "done"
								? "bg-emerald-500/10 border-emerald-500/20 text-accent-emerald"
								: "bg-rose-500/10 border-rose-500/20 text-accent-rose"
						}`}
					>
						<span className="font-semibold">
							{result.status === "done" ? "Resolved:" : "Rejected:"}
						</span>{" "}
						{result.value}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Code */}
			<ShikiCode code={COMBINATOR_CODE[combinator]} language="javascript" />

			{/* Decision table */}
			<div className="overflow-x-auto">
				<table className="w-full text-xs text-left border-collapse">
					<thead>
						<tr className="border-b border-border-primary">
							<th className="pb-2 pr-4 text-text-muted font-medium">Method</th>
							<th className="pb-2 pr-4 text-text-muted font-medium">
								Resolves when
							</th>
							<th className="pb-2 text-text-muted font-medium">Rejects when</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border-primary/50">
						{(
							Object.entries(COMBINATOR_DESCRIPTIONS) as [
								Combinator,
								typeof desc,
							][]
						).map(([key, d]) => (
							<tr
								key={key}
								className={combinator === key ? "bg-cyan-500/5" : ""}
							>
								<td className="py-2 pr-4 font-mono text-accent-cyan-soft">
									Promise.{key}()
								</td>
								<td className="py-2 pr-4 text-text-tertiary">{d.resolves}</td>
								<td className="py-2 text-text-tertiary">{d.rejects}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
