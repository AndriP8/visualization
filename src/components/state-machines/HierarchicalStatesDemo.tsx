import {
	Pause,
	Play,
	SkipForward,
	Volume2,
	VolumeX,
	Wifi,
	WifiOff,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

// Hierarchical state machine for media player
type MediaPlayerState =
	| { status: "stopped" }
	| { status: "playing"; substatus: "normal" | "buffering" }
	| { status: "paused"; position: number };

// Parallel state for network and audio
interface ParallelState {
	network: "online" | "offline";
	audio: "muted" | "unmuted";
}

export function HierarchicalStatesDemo() {
	const [playerState, setPlayerState] = useState<MediaPlayerState>({
		status: "stopped",
	});
	const [parallelState, setParallelState] = useState<ParallelState>({
		network: "online",
		audio: "unmuted",
	});
	const [progress, setProgress] = useState(0);

	// Player controls
	const play = () => {
		setPlayerState({ status: "playing", substatus: "normal" });
		// Simulate buffering
		setTimeout(() => {
			if (playerState.status === "playing") {
				setPlayerState({ status: "playing", substatus: "buffering" });
				setTimeout(() => {
					setPlayerState({ status: "playing", substatus: "normal" });
				}, 1000);
			}
		}, 2000);
	};

	const pause = () => {
		setPlayerState({ status: "paused", position: progress });
	};

	const stop = () => {
		setPlayerState({ status: "stopped" });
		setProgress(0);
	};

	const skip = () => {
		setProgress((p) => Math.min(p + 20, 100));
	};

	// Parallel state controls
	const toggleNetwork = () => {
		setParallelState((s) => ({
			...s,
			network: s.network === "online" ? "offline" : "online",
		}));
	};

	const toggleAudio = () => {
		setParallelState((s) => ({
			...s,
			audio: s.audio === "muted" ? "unmuted" : "muted",
		}));
	};

	// Simulate progress
	useState(() => {
		const interval = setInterval(() => {
			if (
				playerState.status === "playing" &&
				playerState.substatus === "normal"
			) {
				setProgress((p) => {
					if (p >= 100) {
						setPlayerState({ status: "stopped" });
						return 0;
					}
					return p + 1;
				});
			}
		}, 100);
		return () => clearInterval(interval);
	});

	return (
		<div className="space-y-8">
			{/* Hierarchical State Visualization */}
			<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
				<h4 className="text-sm font-semibold text-white mb-4">
					Hierarchical States (Nested)
				</h4>

				<div className="space-y-4">
					{/* Parent states */}
					<div className="grid grid-cols-3 gap-4">
						{(["stopped", "playing", "paused"] as const).map((state) => (
							<div key={state} className="space-y-2">
								<motion.div
									className={`px-4 py-3 rounded-lg border-2 text-center font-semibold ${
										playerState.status === state
											? "bg-violet-900/30 border-violet-500 text-violet-300"
											: "bg-zinc-800 border-zinc-700 text-zinc-500"
									}`}
									animate={{
										scale: playerState.status === state ? 1.02 : 1,
										boxShadow:
											playerState.status === state
												? "0 0 20px rgba(139, 92, 246, 0.3)"
												: "none",
									}}
								>
									{state.toUpperCase()}
								</motion.div>

								{/* Child states (only for playing) */}
								{state === "playing" && (
									<AnimatePresence>
										{playerState.status === "playing" && (
											<motion.div
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: "auto" }}
												exit={{ opacity: 0, height: 0 }}
												className="space-y-2 pl-4 border-l-2 border-violet-500/50"
											>
												{(["normal", "buffering"] as const).map((substatus) => (
													<motion.div
														key={substatus}
														className={`px-3 py-2 rounded border text-xs font-medium ${
															playerState.status === "playing" &&
															playerState.substatus === substatus
																? "bg-cyan-900/30 border-cyan-500 text-cyan-300"
																: "bg-zinc-800 border-zinc-700 text-zinc-500"
														}`}
														animate={{
															scale:
																playerState.status === "playing" &&
																playerState.substatus === substatus
																	? 1.02
																	: 1,
														}}
													>
														{substatus}
													</motion.div>
												))}
											</motion.div>
										)}
									</AnimatePresence>
								)}
							</div>
						))}
					</div>

					{/* Visual Player */}
					<div className="bg-zinc-800 rounded-lg p-6 space-y-4">
						<div className="flex items-center justify-between">
							<div className="text-sm text-zinc-400">
								State:{" "}
								<span className="text-violet-300 font-mono">
									{playerState.status}
									{playerState.status === "playing"
										? `.${playerState.substatus}`
										: ""}
								</span>
							</div>
							<div className="flex items-center gap-4">
								<button
									type="button"
									onClick={toggleNetwork}
									className="text-zinc-400 hover:text-white transition-colors"
									title="Toggle network"
								>
									{parallelState.network === "online" ? (
										<Wifi className="w-4 h-4 text-green-400" />
									) : (
										<WifiOff className="w-4 h-4 text-red-400" />
									)}
								</button>
								<button
									type="button"
									onClick={toggleAudio}
									className="text-zinc-400 hover:text-white transition-colors"
									title="Toggle audio"
								>
									{parallelState.audio === "unmuted" ? (
										<Volume2 className="w-4 h-4" />
									) : (
										<VolumeX className="w-4 h-4 text-amber-400" />
									)}
								</button>
							</div>
						</div>

						{/* Progress bar */}
						<div className="relative h-2 bg-zinc-700 rounded-full overflow-hidden">
							<motion.div
								className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-cyan-500"
								animate={{ width: `${progress}%` }}
								transition={{ duration: 0.1 }}
							/>
						</div>

						{/* Buffering indicator */}
						<AnimatePresence>
							{playerState.status === "playing" &&
								playerState.substatus === "buffering" && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										className="text-xs text-cyan-400 flex items-center gap-2"
									>
										<div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
										Buffering...
									</motion.div>
								)}
						</AnimatePresence>

						{/* Controls */}
						<div className="flex items-center justify-center gap-3">
							<button
								type="button"
								onClick={play}
								disabled={playerState.status === "playing"}
								className="p-3 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-full transition-colors"
								title="Play"
							>
								<Play className="w-5 h-5" />
							</button>
							<button
								type="button"
								onClick={pause}
								disabled={playerState.status !== "playing"}
								className="p-3 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full transition-colors"
								title="Pause"
							>
								<Pause className="w-5 h-5" />
							</button>
							<button
								type="button"
								onClick={stop}
								disabled={playerState.status === "stopped"}
								className="p-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full transition-colors"
								title="Stop"
							>
								<div className="w-4 h-4 bg-current rounded-sm" />
							</button>
							<button
								type="button"
								onClick={skip}
								disabled={playerState.status === "stopped"}
								className="p-3 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full transition-colors"
								title="Skip forward"
							>
								<SkipForward className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Parallel States Visualization */}
			<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
				<h4 className="text-sm font-semibold text-white mb-4">
					Parallel States (Independent)
				</h4>

				<div className="grid md:grid-cols-2 gap-4">
					{/* Network state */}
					<div className="bg-zinc-800 rounded-lg p-4 space-y-3">
						<div className="text-sm font-medium text-zinc-400">
							Network State
						</div>
						<div className="grid grid-cols-2 gap-2">
							{(["online", "offline"] as const).map((state) => (
								<motion.div
									key={state}
									className={`px-3 py-2 rounded border text-center text-sm font-medium ${
										parallelState.network === state
											? state === "online"
												? "bg-green-900/30 border-green-500 text-green-300"
												: "bg-red-900/30 border-red-500 text-red-300"
											: "bg-zinc-700 border-zinc-600 text-zinc-500"
									}`}
									animate={{
										scale: parallelState.network === state ? 1.05 : 1,
									}}
								>
									{state}
								</motion.div>
							))}
						</div>
					</div>

					{/* Audio state */}
					<div className="bg-zinc-800 rounded-lg p-4 space-y-3">
						<div className="text-sm font-medium text-zinc-400">Audio State</div>
						<div className="grid grid-cols-2 gap-2">
							{(["unmuted", "muted"] as const).map((state) => (
								<motion.div
									key={state}
									className={`px-3 py-2 rounded border text-center text-sm font-medium ${
										parallelState.audio === state
											? state === "unmuted"
												? "bg-blue-900/30 border-blue-500 text-blue-300"
												: "bg-amber-900/30 border-amber-500 text-amber-300"
											: "bg-zinc-700 border-zinc-600 text-zinc-500"
									}`}
									animate={{
										scale: parallelState.audio === state ? 1.05 : 1,
									}}
								>
									{state}
								</motion.div>
							))}
						</div>
					</div>
				</div>

				<div className="mt-4 text-xs text-zinc-400">
					<strong className="text-violet-300">Parallel states</strong> operate
					independently. Network and audio can be in any combination: (online,
					muted), (offline, unmuted), etc.
				</div>
			</div>

			{/* Key Insights */}
			<div className="grid md:grid-cols-2 gap-4">
				<div className="bg-violet-950/30 border border-violet-800/50 rounded-lg p-4">
					<div className="text-sm text-violet-300">
						<strong>Hierarchical States:</strong> Parent state "playing"
						contains substates "normal" and "buffering". You can only be in a
						substate when the parent state is active. This models real-world
						constraints.
					</div>
				</div>
				<div className="bg-cyan-950/30 border border-cyan-800/50 rounded-lg p-4">
					<div className="text-sm text-cyan-300">
						<strong>Parallel States:</strong> Network and audio states run
						independently. The player can be online/offline AND muted/unmuted in
						any combination. 4 possible combinations, all valid.
					</div>
				</div>
			</div>
		</div>
	);
}
