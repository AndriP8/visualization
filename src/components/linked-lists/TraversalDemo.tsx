import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";

type Problem = "reverse" | "middle" | "cycle";

const REVERSE_FRAMES = [
	["A", "B", "C", "D"],
	["B", "A", "C", "D"],
	["C", "B", "A", "D"],
	["D", "C", "B", "A"],
];
const MIDDLE_NODES = ["A", "B", "C", "D", "E"];
const CYCLE_NODES = ["A", "B", "C", "D"];
export const CYCLE_SLOW = [0, 1, 2, 3, 1];
export const CYCLE_FAST = [0, 2, 1, 3, 2];

const MAX_STEP: Record<Problem, number> = {
	reverse: 3,
	middle: 2,
	cycle: 3,
};

const chipBase =
	"flex h-10 w-10 items-center justify-center rounded border text-sm font-bold transition-all duration-300";

function Chip({
	value,
	tone = "idle",
}: {
	value: string;
	tone?: "idle" | "slow" | "fast" | "both";
}) {
	const color = match(tone)
		.with("both", () => "border-purple-400/60 bg-purple-500/25 text-purple-200")
		.with("slow", () => "border-amber-400/60 bg-amber-500/20 text-amber-200")
		.with("fast", () => "border-cyan-400/60 bg-cyan-500/20 text-cyan-200")
		.otherwise(() => "border-zinc-600/60 bg-zinc-700/50 text-zinc-300");

	return <div className={`${chipBase} ${color}`}>{value}</div>;
}

export function TraversalDemo() {
	const [problem, setProblem] = useState<Problem>("reverse");
	const [step, setStep] = useState(0);
	const [playing, setPlaying] = useState(false);

	const maxStep = MAX_STEP[problem];
	const done = step >= maxStep;

	useEffect(() => {
		if (!playing) return;
		if (step >= maxStep) {
			setPlaying(false);
			return;
		}
		const timer = setTimeout(() => setStep((value) => value + 1), 700);
		return () => clearTimeout(timer);
	}, [playing, step, maxStep]);

	function choose(next: Problem) {
		setProblem(next);
		setStep(0);
		setPlaying(false);
	}

	function play() {
		if (done) setStep(0);
		setPlaying(true);
	}

	const slowIndex = Math.min(step, MIDDLE_NODES.length - 1);
	const fastIndex = Math.min(step * 2, MIDDLE_NODES.length - 1);

	const reverseOrder = REVERSE_FRAMES[step] ?? [];
	const cycleSlow = CYCLE_SLOW[step] ?? 3;
	const cycleFast = CYCLE_FAST[step] ?? 3;

	return (
		<DemoSection
			title="Algorithms in the wild: reversing, middles & cycles"
			description="Three jobs a linked list makes easy. Each one walks the links once and changes what they point at, so the list is rearranged without copying values. Pick a problem, then play or step through it."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center gap-2">
					{(
						[
							{ id: "reverse" as Problem, label: "Reverse a list" },
							{ id: "middle" as Problem, label: "Find the middle" },
							{ id: "cycle" as Problem, label: "Detect a cycle" },
						] as const
					).map(({ id, label }) => (
						<button
							key={id}
							type="button"
							onClick={() => choose(id)}
							className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
								problem === id
									? "border-indigo-500/50 bg-indigo-600/30 text-indigo-300"
									: "border-zinc-700/50 bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800/70"
							}`}
						>
							{label}
						</button>
					))}
					<button
						type="button"
						onClick={play}
						disabled={playing}
						className="rounded-lg border border-indigo-500/30 bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-600/30 disabled:opacity-50"
					>
						{playing ? "Playing…" : "▶ Play"}
					</button>
					<button
						type="button"
						onClick={() => {
							setPlaying(false);
							setStep((value) => Math.min(value + 1, maxStep));
						}}
						disabled={playing || done}
						className="rounded-lg border border-amber-500/30 bg-amber-600/20 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-600/30 disabled:opacity-50"
					>
						Step
					</button>
					<button
						type="button"
						onClick={() => {
							setPlaying(false);
							setStep(0);
						}}
						className="rounded-lg border border-zinc-600/30 bg-zinc-700/40 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-700/60"
					>
						Reset
					</button>
				</div>

				<div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					{match(problem)
						.with("reverse", () => (
							<div className="min-w-max space-y-3">
								<div className="flex items-center gap-1.5">
									<span className="font-mono text-xs text-zinc-500">
										head →
									</span>
									{reverseOrder.map((value, index) => (
										<div key={value} className="flex items-center gap-1.5">
											<Chip
												value={value}
												tone={index === 0 ? "slow" : "idle"}
											/>
											{index < reverseOrder.length - 1 && (
												<span className="text-sm text-zinc-500">→</span>
											)}
										</div>
									))}
									<span className="font-mono text-xs text-zinc-600">
										→ null
									</span>
								</div>
								<p className="text-xs text-zinc-400">
									Reverse changes each link to point at the node behind it. The
									last node becomes the new head, so nothing needs to move in
									memory.
								</p>
							</div>
						))
						.with("middle", () => (
							<div className="min-w-max space-y-3">
								<div className="flex items-center gap-1.5">
									{MIDDLE_NODES.map((value, index) => {
										const tone = match({
											slow: index === slowIndex,
											fast: index === fastIndex,
										})
											.with({ slow: true, fast: true }, () => "both" as const)
											.with({ slow: true }, () => "slow" as const)
											.with({ fast: true }, () => "fast" as const)
											.otherwise(() => "idle" as const);
										return (
											<div key={value} className="flex items-center gap-1.5">
												<div className="flex flex-col items-center gap-1">
													<Chip value={value} tone={tone} />
													<span className="text-[10px] text-zinc-600">
														{index === slowIndex ? "slow" : ""}
														{index === slowIndex && index === fastIndex
															? " + fast"
															: index === fastIndex
																? "fast"
																: ""}
													</span>
												</div>
												{index < MIDDLE_NODES.length - 1 && (
													<span className="text-sm text-zinc-500">→</span>
												)}
											</div>
										);
									})}
								</div>
								<p className="text-xs text-zinc-400">
									One pointer moves one node at a time (slow). Another moves two
									at a time (fast). When fast reaches the end, slow is standing
									on the middle, without counting the list first. With an even
									number of nodes there are two middles — slow stops on the
									first of them.
								</p>
							</div>
						))
						.with("cycle", () => (
							<div className="min-w-max space-y-3">
								<div className="flex items-center gap-1.5">
									{CYCLE_NODES.map((value, index) => {
										const tone = match({
											slow: index === cycleSlow,
											fast: index === cycleFast,
										})
											.with({ slow: true, fast: true }, () => "both" as const)
											.with({ slow: true }, () => "slow" as const)
											.with({ fast: true }, () => "fast" as const)
											.otherwise(() => "idle" as const);
										return (
											<div key={value} className="flex items-center gap-1.5">
												<div className="flex flex-col items-center gap-1">
													<Chip value={value} tone={tone} />
													<span className="text-[10px] text-zinc-600">
														{index === cycleSlow ? "slow" : ""}
														{index === cycleSlow && index === cycleFast
															? " + fast"
															: index === cycleFast
																? "fast"
																: ""}
													</span>
												</div>
												{index < CYCLE_NODES.length - 1 && (
													<span className="text-sm text-zinc-500">→</span>
												)}
											</div>
										);
									})}
									<span className="font-mono text-xs text-zinc-600">
										↩ back to B
									</span>
								</div>
								<p className="text-xs text-zinc-400">
									Here node D points back to B, so the list never ends. The same
									slow and fast pointers must eventually land on the same node:
									fast gains one position on slow every step, so once both are
									inside the loop it has to catch slow — they cannot step over
									each other.
									{step >= 3 && (
										<span className="ml-1 text-purple-300">
											They meet at D, so a cycle exists.
										</span>
									)}
								</p>
							</div>
						))
						.exhaustive()}
				</div>

				<output aria-live="polite" className="block text-sm text-zinc-400">
					Step {step} of {maxStep}
					{problem === "reverse" && done && " · list reversed"}
					{problem === "middle" && done && " · middle is C"}
					{problem === "cycle" && done && " · cycle detected"}
				</output>
			</div>
		</DemoSection>
	);
}
