import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Protocol } from "./types";

type ScenarioPhase =
	| "idle"
	| "parsing-html-1"
	| "downloading-script"
	| "executing-script"
	| "parsing-html-2"
	| "dom-ready";

interface ScenarioState {
	phase: ScenarioPhase;
	htmlProgress: number;
	scriptDownloaded: boolean;
	scriptExecuted: boolean;
	domReady: boolean;
}

interface BlockingScriptsDemoProps {
	protocol: Protocol;
}

export default function BlockingScriptsDemo({
	protocol: _protocol,
}: BlockingScriptsDemoProps) {
	const [syncState, setSyncState] = useState<ScenarioState>({
		phase: "idle",
		htmlProgress: 0,
		scriptDownloaded: false,
		scriptExecuted: false,
		domReady: false,
	});

	const [asyncState, setAsyncState] = useState<ScenarioState>({
		phase: "idle",
		htmlProgress: 0,
		scriptDownloaded: false,
		scriptExecuted: false,
		domReady: false,
	});

	const [deferState, setDeferState] = useState<ScenarioState>({
		phase: "idle",
		htmlProgress: 0,
		scriptDownloaded: false,
		scriptExecuted: false,
		domReady: false,
	});

	const [running, setRunning] = useState(false);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const clearTimeouts = useCallback(() => {
		for (const timeout of timeoutsRef.current) {
			clearTimeout(timeout);
		}
		timeoutsRef.current = [];
	}, []);

	useEffect(() => {
		return () => clearTimeouts();
	}, [clearTimeouts]);

	const reset = useCallback(() => {
		clearTimeouts();
		setRunning(false);
		const initialState: ScenarioState = {
			phase: "idle",
			htmlProgress: 0,
			scriptDownloaded: false,
			scriptExecuted: false,
			domReady: false,
		};
		setSyncState(initialState);
		setAsyncState(initialState);
		setDeferState(initialState);
	}, [clearTimeouts]);

	const play = useCallback(() => {
		reset();
		setRunning(true);

		// Sync scenario timeline
		const syncTimeline = [
			{
				delay: 0,
				action: () =>
					setSyncState((s) => ({
						...s,
						phase: "parsing-html-1",
						htmlProgress: 0,
					})),
			},
			{
				delay: 500,
				action: () => setSyncState((s) => ({ ...s, htmlProgress: 30 })),
			},
			{
				delay: 600,
				action: () =>
					setSyncState((s) => ({ ...s, phase: "downloading-script" })),
			},
			{
				delay: 1200,
				action: () => setSyncState((s) => ({ ...s, scriptDownloaded: true })),
			},
			{
				delay: 1300,
				action: () =>
					setSyncState((s) => ({ ...s, phase: "executing-script" })),
			},
			{
				delay: 1800,
				action: () => setSyncState((s) => ({ ...s, scriptExecuted: true })),
			},
			{
				delay: 1900,
				action: () =>
					setSyncState((s) => ({
						...s,
						phase: "parsing-html-2",
						htmlProgress: 30,
					})),
			},
			{
				delay: 2400,
				action: () => setSyncState((s) => ({ ...s, htmlProgress: 100 })),
			},
			{
				delay: 2500,
				action: () =>
					setSyncState((s) => ({ ...s, phase: "dom-ready", domReady: true })),
			},
		];

		// Async scenario timeline
		const asyncTimeline = [
			{
				delay: 0,
				action: () =>
					setAsyncState((s) => ({
						...s,
						phase: "parsing-html-1",
						htmlProgress: 0,
					})),
			},
			{
				delay: 0,
				action: () =>
					setAsyncState((s) => ({ ...s, phase: "downloading-script" })),
			},
			{
				delay: 1000,
				action: () => setAsyncState((s) => ({ ...s, htmlProgress: 100 })),
			},
			{
				delay: 1100,
				action: () => setAsyncState((s) => ({ ...s, scriptDownloaded: true })),
			},
			{
				delay: 1200,
				action: () =>
					setAsyncState((s) => ({ ...s, phase: "executing-script" })),
			},
			{
				delay: 1500,
				action: () => setAsyncState((s) => ({ ...s, scriptExecuted: true })),
			},
			{
				delay: 1600,
				action: () =>
					setAsyncState((s) => ({ ...s, phase: "dom-ready", domReady: true })),
			},
		];

		// Defer scenario timeline
		const deferTimeline = [
			{
				delay: 0,
				action: () =>
					setDeferState((s) => ({
						...s,
						phase: "parsing-html-1",
						htmlProgress: 0,
					})),
			},
			{
				delay: 0,
				action: () =>
					setDeferState((s) => ({ ...s, phase: "downloading-script" })),
			},
			{
				delay: 1000,
				action: () => setDeferState((s) => ({ ...s, htmlProgress: 100 })),
			},
			{
				delay: 1100,
				action: () => setDeferState((s) => ({ ...s, scriptDownloaded: true })),
			},
			{
				delay: 1200,
				action: () =>
					setDeferState((s) => ({ ...s, phase: "executing-script" })),
			},
			{
				delay: 1500,
				action: () => setDeferState((s) => ({ ...s, scriptExecuted: true })),
			},
			{
				delay: 1600,
				action: () =>
					setDeferState((s) => ({ ...s, phase: "dom-ready", domReady: true })),
			},
		];

		for (const step of syncTimeline) {
			const timeout = setTimeout(step.action, step.delay);
			timeoutsRef.current.push(timeout);
		}

		for (const step of asyncTimeline) {
			const timeout = setTimeout(step.action, step.delay);
			timeoutsRef.current.push(timeout);
		}

		for (const step of deferTimeline) {
			const timeout = setTimeout(step.action, step.delay);
			timeoutsRef.current.push(timeout);
		}

		const endTimeout = setTimeout(() => {
			setRunning(false);
		}, 3000);
		timeoutsRef.current.push(endTimeout);
	}, [reset]);

	return (
		<div className="space-y-6">
			{/* Explanation */}
			<div className="p-4 bg-surface-primary/50 border border-border-primary rounded-lg text-sm text-text-tertiary">
				<p>
					<span className="text-text-primary font-medium">
						Compare loading behavior:
					</span>{" "}
					Watch how sync, async, and defer scripts affect page load time. Sync
					scripts <span className="text-accent-rose">block parsing</span>{" "}
					(slower), while async and defer allow{" "}
					<span className="text-accent-cyan">parallel loading</span> (faster).
				</p>
			</div>

			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={play}
					disabled={running}
					className="px-4 py-2 bg-violet-500 text-text-primary rounded-md text-sm font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Play
				</button>
				<button
					type="button"
					onClick={reset}
					className="px-4 py-2 bg-surface-tertiary text-text-primary rounded-md text-sm font-medium hover:bg-surface-tertiary transition-colors"
				>
					Reset
				</button>
			</div>

			<div className="grid md:grid-cols-3 gap-6">
				<ScenarioColumn
					title="Synchronous <script>"
					state={syncState}
					color="rose"
					isBlocking={true}
				/>
				<ScenarioColumn
					title="Async <script async>"
					state={asyncState}
					color="cyan"
					isBlocking={false}
				/>
				<ScenarioColumn
					title="Defer <script defer>"
					state={deferState}
					color="amber"
					isBlocking={false}
				/>
			</div>

			{/* Results Summary */}
			{syncState.domReady && (
				<div className="grid md:grid-cols-3 gap-4 text-center text-sm">
					<div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded">
						<div className="text-accent-rose font-medium">Sync: ~2500ms</div>
						<div className="text-xs text-text-muted mt-1">
							Slowest (blocked)
						</div>
					</div>
					<div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
						<div className="text-accent-cyan font-medium">Async: ~1600ms</div>
						<div className="text-xs text-text-muted mt-1">36% faster</div>
					</div>
					<div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded">
						<div className="text-accent-amber font-medium">Defer: ~1600ms</div>
						<div className="text-xs text-text-muted mt-1">36% faster</div>
					</div>
				</div>
			)}
		</div>
	);
}

interface ScenarioColumnProps {
	title: string;
	state: ScenarioState;
	color: "rose" | "cyan" | "amber";
	isBlocking: boolean;
}

function ScenarioColumn({
	title,
	state,
	color,
	isBlocking,
}: ScenarioColumnProps) {
	const colorClasses = {
		rose: "bg-rose-500",
		cyan: "bg-cyan-500",
		amber: "bg-amber-500",
	};

	const textClasses = {
		rose: "text-accent-rose",
		cyan: "text-accent-cyan",
		amber: "text-accent-amber",
	};

	const borderBgClasses = {
		rose: "border-rose-500/50 bg-rose-500/10",
		cyan: "border-cyan-500/50 bg-cyan-500/10",
		amber: "border-amber-500/50 bg-amber-500/10",
	};

	const isIdlePhase =
		isBlocking &&
		(state.phase === "downloading-script" ||
			state.phase === "executing-script");

	return (
		<div className="p-4 bg-surface-primary rounded border border-border-primary space-y-4">
			<h3 className={`text-sm font-medium ${textClasses[color]}`}>{title}</h3>

			{/* HTML Parsing Progress */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<span className="text-xs text-text-tertiary">HTML Parsing</span>
					<span className="text-xs text-text-muted">{state.htmlProgress}%</span>
				</div>
				<div className="h-4 bg-surface-secondary rounded overflow-hidden relative">
					{isIdlePhase && (
						<div className="absolute inset-0 bg-rose-500/20 border-2 border-rose-500/50 animate-pulse">
							<span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-accent-rose">
								BLOCKED
							</span>
						</div>
					)}
					{!isIdlePhase && (
						<motion.div
							className={`h-full ${colorClasses[color]}`}
							initial={{ width: "0%" }}
							animate={{ width: `${state.htmlProgress}%` }}
							transition={{ duration: 0.3 }}
						/>
					)}
				</div>
			</div>

			{/* Script Download */}
			<div className="space-y-2">
				<span className="text-xs text-text-tertiary">Script Download</span>
				<div
					className={`p-2 rounded border ${
						state.phase === "downloading-script" || state.scriptDownloaded
							? borderBgClasses[color]
							: "border-border-secondary bg-surface-secondary"
					}`}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-mono text-text-secondary">
							app.js
						</span>
						{state.scriptDownloaded && (
							<span className="text-xs text-accent-green-soft">✓ Done</span>
						)}
						{state.phase === "downloading-script" &&
							!state.scriptDownloaded && (
								<span className="text-xs text-accent-amber-soft animate-pulse">
									Loading...
								</span>
							)}
					</div>
				</div>
			</div>

			{/* Script Execution */}
			<div className="space-y-2">
				<span className="text-xs text-text-tertiary">Script Execution</span>
				<div
					className={`p-2 rounded border ${
						state.phase === "executing-script" || state.scriptExecuted
							? borderBgClasses[color]
							: "border-border-secondary bg-surface-secondary"
					}`}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-mono text-text-secondary">
							Execute
						</span>
						{state.scriptExecuted && (
							<span className="text-xs text-accent-green-soft">✓ Done</span>
						)}
						{state.phase === "executing-script" && !state.scriptExecuted && (
							<span className="text-xs text-accent-amber-soft animate-pulse">
								Running...
							</span>
						)}
					</div>
				</div>
			</div>

			{/* DOMContentLoaded */}
			<div className="space-y-2">
				<span className="text-xs text-text-tertiary">DOMContentLoaded</span>
				<div
					className={`p-2 rounded border ${state.domReady ? "border-green-500/50 bg-green-500/10" : "border-border-secondary bg-surface-secondary"}`}
				>
					<div className="flex items-center justify-center">
						{state.domReady ? (
							<span className="text-xs font-medium text-accent-green-soft">
								✓ DOM Ready
							</span>
						) : (
							<span className="text-xs text-text-muted">Waiting...</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
