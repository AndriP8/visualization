import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";

type RecoveryStep =
	| "action-1"
	| "error"
	| "thought"
	| "action-2"
	| "observation"
	| "final";

const TRACE: { id: RecoveryStep; type: string; text: string; color: string }[] =
	[
		{
			id: "action-1",
			type: "action",
			text: 'get_stock_price({ "ticker": "APPLE" })',
			color: "text-amber-300",
		},
		{
			id: "error",
			type: "tool error",
			text: "Ticker not found. Did you mean AAPL?",
			color: "text-rose-300",
		},
		{
			id: "thought",
			type: "thought",
			text: "The API expects the exact ticker symbol. Retry with AAPL.",
			color: "text-violet-300",
		},
		{
			id: "action-2",
			type: "action",
			text: 'get_stock_price({ "ticker": "AAPL" })',
			color: "text-amber-300",
		},
		{
			id: "observation",
			type: "observation",
			text: "$185.20",
			color: "text-zinc-300",
		},
		{
			id: "final",
			type: "final",
			text: "Apple's current stock price is $185.20.",
			color: "text-emerald-300",
		},
	];

export function ErrorRecoveryDemo() {
	const [step, setStep] = useState(0);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		if (!playing) return;
		const timer = window.setInterval(() => {
			setStep((current) => {
				if (current >= TRACE.length) {
					setPlaying(false);
					return current;
				}
				return current + 1;
			});
		}, 650);
		return () => window.clearInterval(timer);
	}, [playing]);

	const start = () => {
		setStep(0);
		setPlaying(true);
	};
	const status = match({ step, playing })
		.with({ playing: true }, () => "Running")
		.with({ step: TRACE.length }, () => "Recovered")
		.otherwise(() => "Ready");

	return (
		<DemoSection
			title="Demo 2: Error Recovery"
			description="A tool error becomes an observation in the loop. The agent can inspect it, change its action, and retry—subject to a termination and retry budget."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="text-xs text-zinc-500">
						Status: <span className="font-mono text-zinc-300">{status}</span>
					</div>
					<button
						type="button"
						onClick={start}
						disabled={playing}
						className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20 disabled:opacity-40"
					>
						{playing ? "Recovering…" : "Run recovery"}
					</button>
				</div>
				<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
					<div className="space-y-2">
						{TRACE.map((item, index) => (
							<motion.div
								key={item.id}
								animate={{ opacity: index < step ? 1 : 0.28 }}
								className={`rounded-lg border p-2.5 text-xs ${index === step - 1 ? "border-cyan-500/40 bg-cyan-500/10" : "border-zinc-800 bg-zinc-900/60"}`}
							>
								<div
									className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${item.color}`}
								>
									{item.type}
								</div>
								<div className="font-mono text-zinc-300">{item.text}</div>
							</motion.div>
						))}
					</div>
				</div>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<Metric
						label="Attempts"
						value={Math.min(
							2,
							TRACE.slice(0, step).filter((item) =>
								item.id.startsWith("action"),
							).length,
						).toString()}
					/>
					<Metric
						label="Errors"
						value={TRACE.slice(0, step)
							.filter((item) => item.id === "error")
							.length.toString()}
					/>
					<Metric label="Retry budget" value="3" />
					<Metric
						label="Terminated"
						value={step === TRACE.length ? "Yes" : "No"}
					/>
				</div>
				<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 text-xs text-zinc-400">
					<span className="font-medium text-rose-300">Failure boundary:</span>{" "}
					feed the real error back into the model, validate the retry, and
					enforce a maximum iteration count so recovery cannot become an
					infinite loop.
				</div>
			</div>
		</DemoSection>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
			<div className="text-[10px] uppercase tracking-wider text-zinc-500">
				{label}
			</div>
			<div className="font-mono text-lg font-semibold text-zinc-200">
				{value}
			</div>
		</div>
	);
}
