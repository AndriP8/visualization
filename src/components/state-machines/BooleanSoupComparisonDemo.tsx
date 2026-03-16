import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

// Boolean Soup approach (the wrong way)
interface BooleanState {
	isLoading: boolean;
	isError: boolean;
	isSuccess: boolean;
	data: string | null;
	error: string | null;
}

// State Machine approach (the right way)
type RequestState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; data: string }
	| { status: "error"; error: string };

export function BooleanSoupComparisonDemo() {
	// Boolean soup implementation
	const [booleanState, setBooleanState] = useState<BooleanState>({
		isLoading: false,
		isError: false,
		isSuccess: false,
		data: null,
		error: null,
	});

	// State machine implementation
	const [machineState, setMachineState] = useState<RequestState>({
		status: "idle",
	});

	const [showImpossibleState, setShowImpossibleState] = useState(false);

	// Simulate API call with boolean soup
	const fetchWithBooleans = async () => {
		setBooleanState({
			isLoading: true,
			isError: false,
			isSuccess: false,
			data: null,
			error: null,
		});

		// Simulate network delay
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// Simulate random success/failure
		if (Math.random() > 0.5) {
			setBooleanState({
				isLoading: false,
				isError: false,
				isSuccess: true,
				data: "User data loaded",
				error: null,
			});
		} else {
			setBooleanState({
				isLoading: false,
				isError: true,
				isSuccess: false,
				data: null,
				error: "Network timeout",
			});
		}
	};

	// Simulate API call with state machine
	const fetchWithMachine = async () => {
		setMachineState({ status: "loading" });

		await new Promise((resolve) => setTimeout(resolve, 1500));

		if (Math.random() > 0.5) {
			setMachineState({ status: "success", data: "User data loaded" });
		} else {
			setMachineState({ status: "error", error: "Network timeout" });
		}
	};

	// Show impossible state (bug demo)
	const createImpossibleState = () => {
		setShowImpossibleState(true);
		setBooleanState({
			isLoading: true,
			isError: true,
			isSuccess: true,
			data: "User data loaded",
			error: "Network timeout",
		});

		setTimeout(() => {
			setShowImpossibleState(false);
			setBooleanState({
				isLoading: false,
				isError: false,
				isSuccess: false,
				data: null,
				error: null,
			});
		}, 3000);
	};

	const getBooleanStateCount = () => {
		return [
			booleanState.isLoading,
			booleanState.isError,
			booleanState.isSuccess,
		].filter(Boolean).length;
	};

	return (
		<div className="space-y-8">
			<div className="grid lg:grid-cols-2 gap-6">
				{/* Boolean Soup (Wrong Way) */}
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-semibold text-white">Boolean Soup</h3>
						<span className="px-2 py-0.5 bg-rose-900/30 border border-rose-700/50 text-rose-400 text-xs rounded">
							Fragile
						</span>
					</div>

					<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 space-y-4 min-h-[400px]">
						{/* Boolean flags visualization */}
						<div className="space-y-2">
							<div className="text-xs text-zinc-500 font-mono mb-3">
								Boolean Flags:
							</div>
							{[
								{ key: "isLoading", value: booleanState.isLoading },
								{ key: "isError", value: booleanState.isError },
								{ key: "isSuccess", value: booleanState.isSuccess },
							].map((flag) => (
								<motion.div
									key={flag.key}
									className={`px-3 py-2 rounded border ${
										flag.value
											? "bg-rose-900/20 border-rose-500 text-rose-400"
											: "bg-zinc-800 border-zinc-700 text-zinc-500"
									}`}
									animate={{
										scale: flag.value ? 1.02 : 1,
									}}
									transition={{ duration: 0.2 }}
								>
									<code className="text-xs font-mono">
										{flag.key}: {flag.value ? "true" : "false"}
									</code>
								</motion.div>
							))}
						</div>

						{/* Visual state representation */}
						<div className="border-t border-zinc-700 pt-4">
							<AnimatePresence mode="wait">
								{booleanState.isLoading && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 10 }}
										className="flex items-center gap-2 text-blue-400"
									>
										<Loader2 className="w-5 h-5 animate-spin" />
										<span>Loading...</span>
									</motion.div>
								)}
								{booleanState.isSuccess && !booleanState.isLoading && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 10 }}
										className="flex items-center gap-2 text-green-400"
									>
										<CheckCircle className="w-5 h-5" />
										<span>{booleanState.data}</span>
									</motion.div>
								)}
								{booleanState.isError && !booleanState.isLoading && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 10 }}
										className="flex items-center gap-2 text-red-400"
									>
										<AlertCircle className="w-5 h-5" />
										<span>{booleanState.error}</span>
									</motion.div>
								)}
							</AnimatePresence>

							{/* Impossible state warning */}
							{getBooleanStateCount() > 1 && (
								<motion.div
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									className="mt-4 bg-rose-950/50 border border-rose-500 rounded-lg p-3"
								>
									<div className="flex items-start gap-2">
										<AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
										<div className="text-sm text-rose-300">
											<div className="font-semibold">
												Impossible State Detected!
											</div>
											<div className="text-xs text-rose-400 mt-1">
												{getBooleanStateCount()} flags are true simultaneously.
												This should never happen.
											</div>
										</div>
									</div>
								</motion.div>
							)}
						</div>

						{/* Controls */}
						<div className="border-t border-zinc-700 pt-4 space-y-2">
							<button
								type="button"
								onClick={fetchWithBooleans}
								disabled={booleanState.isLoading}
								className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
							>
								Fetch Data
							</button>
							<button
								type="button"
								onClick={createImpossibleState}
								disabled={showImpossibleState}
								className="w-full px-4 py-2 bg-rose-900/50 hover:bg-rose-900 disabled:bg-zinc-700 disabled:text-zinc-500 text-rose-300 border border-rose-700 rounded-lg text-sm font-medium transition-colors"
							>
								Trigger Bug (Impossible State)
							</button>
						</div>
					</div>
				</div>

				{/* State Machine (Right Way) */}
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-semibold text-white">State Machine</h3>
						<span className="px-2 py-0.5 bg-green-900/30 border border-green-700/50 text-green-400 text-xs rounded">
							Robust
						</span>
					</div>

					<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 space-y-4 min-h-[400px]">
						{/* State visualization */}
						<div className="space-y-2">
							<div className="text-xs text-zinc-500 font-mono mb-3">
								Current State:
							</div>
							{(["idle", "loading", "success", "error"] as const).map(
								(state) => (
									<motion.div
										key={state}
										className={`px-3 py-2 rounded border ${
											machineState.status === state
												? "bg-violet-900/30 border-violet-500 text-violet-300"
												: "bg-zinc-800 border-zinc-700 text-zinc-500"
										}`}
										animate={{
											scale: machineState.status === state ? 1.02 : 1,
											boxShadow:
												machineState.status === state
													? "0 0 20px rgba(139, 92, 246, 0.3)"
													: "none",
										}}
										transition={{ duration: 0.2 }}
									>
										<code className="text-xs font-mono">
											{state.toUpperCase()}
											{machineState.status === state && " ✓"}
										</code>
									</motion.div>
								),
							)}
						</div>

						{/* Visual state representation */}
						<div className="border-t border-zinc-700 pt-4">
							<AnimatePresence mode="wait">
								{machineState.status === "idle" && (
									<motion.div
										key="idle"
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 10 }}
										className="text-zinc-400"
									>
										Ready to fetch data
									</motion.div>
								)}
								{machineState.status === "loading" && (
									<motion.div
										key="loading"
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 10 }}
										className="flex items-center gap-2 text-blue-400"
									>
										<Loader2 className="w-5 h-5 animate-spin" />
										<span>Loading...</span>
									</motion.div>
								)}
								{machineState.status === "success" && (
									<motion.div
										key="success"
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 10 }}
										className="flex items-center gap-2 text-green-400"
									>
										<CheckCircle className="w-5 h-5" />
										<span>{machineState.data}</span>
									</motion.div>
								)}
								{machineState.status === "error" && (
									<motion.div
										key="error"
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 10 }}
										className="flex items-center gap-2 text-red-400"
									>
										<AlertCircle className="w-5 h-5" />
										<span>{machineState.error}</span>
									</motion.div>
								)}
							</AnimatePresence>

							{/* Always valid state guarantee */}
							<motion.div
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								className="mt-4 bg-green-950/30 border border-green-700/50 rounded-lg p-3"
							>
								<div className="flex items-start gap-2">
									<CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
									<div className="text-sm text-green-300">
										<div className="font-semibold">
											Always in exactly ONE state
										</div>
										<div className="text-xs text-green-400 mt-1">
											Impossible states are prevented by TypeScript. Can't be
											loading AND error simultaneously.
										</div>
									</div>
								</div>
							</motion.div>
						</div>

						{/* Controls */}
						<div className="border-t border-zinc-700 pt-4">
							<button
								type="button"
								onClick={fetchWithMachine}
								disabled={machineState.status === "loading"}
								className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
							>
								Fetch Data
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Comparison Summary */}
			<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
				<h4 className="text-sm font-semibold text-white mb-4">
					Why State Machines Win:
				</h4>
				<div className="grid md:grid-cols-3 gap-4 text-sm">
					<div className="space-y-2">
						<div className="text-rose-400 font-medium">
							Boolean Soup Problems:
						</div>
						<ul className="text-zinc-400 space-y-1 text-xs list-disc list-inside">
							<li>8 possible states (2³), only 4 valid</li>
							<li>No compiler enforcement</li>
							<li>Race conditions create bugs</li>
							<li>Impossible to reason about</li>
						</ul>
					</div>
					<div className="space-y-2">
						<div className="text-violet-400 font-medium">
							State Machine Benefits:
						</div>
						<ul className="text-zinc-400 space-y-1 text-xs list-disc list-inside">
							<li>Exactly 4 states, all valid</li>
							<li>TypeScript enforces correctness</li>
							<li>Transitions are explicit</li>
							<li>Self-documenting code</li>
						</ul>
					</div>
					<div className="space-y-2">
						<div className="text-cyan-400 font-medium">Type Safety:</div>
						<ul className="text-zinc-400 space-y-1 text-xs list-disc list-inside">
							<li>Success state MUST have data</li>
							<li>Error state MUST have error</li>
							<li>Loading/idle have neither</li>
							<li>Impossible to access wrong field</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
