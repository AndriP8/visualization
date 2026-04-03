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
			<div className="bg-surface-primary border border-border-secondary rounded-lg p-6">
				<h4 className="text-sm font-semibold text-text-primary mb-4">
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
											? "bg-violet-900/30 border-violet-500 text-accent-violet"
											: "bg-surface-secondary border-border-secondary text-text-muted"
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
																? "bg-cyan-900/30 border-cyan-500 text-accent-cyan"
																: "bg-surface-secondary border-border-secondary text-text-muted"
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
					<div className="bg-surface-secondary rounded-lg p-6 space-y-4">
						<div className="flex items-center justify-between">
							<div className="text-sm text-text-tertiary">
								State:{" "}
								<span className="text-accent-violet font-mono">
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
									className="text-text-tertiary hover:text-text-primary transition-colors"
									title="Toggle network"
								>
									{parallelState.network === "online" ? (
										<Wifi className="w-4 h-4 text-accent-green-soft" />
									) : (
										<WifiOff className="w-4 h-4 text-accent-red-soft" />
									)}
								</button>
								<button
									type="button"
									onClick={toggleAudio}
									className="text-text-tertiary hover:text-text-primary transition-colors"
									title="Toggle audio"
								>
									{parallelState.audio === "unmuted" ? (
										<Volume2 className="w-4 h-4" />
									) : (
										<VolumeX className="w-4 h-4 text-accent-amber-soft" />
									)}
								</button>
							</div>
						</div>

						{/* Progress bar */}
						<div className="relative h-2 bg-surface-tertiary rounded-full overflow-hidden">
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
										className="text-xs text-accent-cyan-soft flex items-center gap-2"
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
								className="p-3 bg-violet-600 hover:bg-violet-700 disabled:bg-surface-tertiary disabled:text-text-muted text-text-primary rounded-full transition-colors"
								title="Play"
							>
								<Play className="w-5 h-5" />
							</button>
							<button
								type="button"
								onClick={pause}
								disabled={playerState.status !== "playing"}
								className="p-3 bg-surface-tertiary hover:bg-surface-tertiary disabled:bg-surface-secondary disabled:text-text-faint text-text-primary rounded-full transition-colors"
								title="Pause"
							>
								<Pause className="w-5 h-5" />
							</button>
							<button
								type="button"
								onClick={stop}
								disabled={playerState.status === "stopped"}
								className="p-2 bg-surface-tertiary hover:bg-surface-tertiary disabled:bg-surface-secondary disabled:text-text-faint text-text-primary rounded-full transition-colors"
								title="Stop"
							>
								<div className="w-4 h-4 bg-current rounded-sm" />
							</button>
							<button
								type="button"
								onClick={skip}
								disabled={playerState.status === "stopped"}
								className="p-3 bg-surface-tertiary hover:bg-surface-tertiary disabled:bg-surface-secondary disabled:text-text-faint text-text-primary rounded-full transition-colors"
								title="Skip forward"
							>
								<SkipForward className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Parallel States Visualization */}
			<div className="bg-surface-primary border border-border-secondary rounded-lg p-6">
				<h4 className="text-sm font-semibold text-text-primary mb-4">
					Parallel States (Independent)
				</h4>

				<div className="grid md:grid-cols-2 gap-4">
					{/* Network state */}
					<div className="bg-surface-secondary rounded-lg p-4 space-y-3">
						<div className="text-sm font-medium text-text-tertiary">
							Network State
						</div>
						<div className="grid grid-cols-2 gap-2">
							{(["online", "offline"] as const).map((state) => (
								<motion.div
									key={state}
									className={`px-3 py-2 rounded border text-center text-sm font-medium ${
										parallelState.network === state
											? state === "online"
												? "bg-green-900/30 border-green-500 text-accent-green"
												: "bg-red-900/30 border-red-500 text-accent-red"
											: "bg-surface-tertiary border-border-tertiary text-text-muted"
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
					<div className="bg-surface-secondary rounded-lg p-4 space-y-3">
						<div className="text-sm font-medium text-text-tertiary">
							Audio State
						</div>
						<div className="grid grid-cols-2 gap-2">
							{(["unmuted", "muted"] as const).map((state) => (
								<motion.div
									key={state}
									className={`px-3 py-2 rounded border text-center text-sm font-medium ${
										parallelState.audio === state
											? state === "unmuted"
												? "bg-blue-900/30 border-blue-500 text-accent-blue"
												: "bg-amber-900/30 border-amber-500 text-accent-amber"
											: "bg-surface-tertiary border-border-tertiary text-text-muted"
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

				<div className="mt-4 text-xs text-text-tertiary">
					<strong className="text-accent-violet">Parallel states</strong>{" "}
					operate independently. Network and audio can be in any combination:
					(online, muted), (offline, unmuted), etc.
				</div>
			</div>

			{/* Key Insights */}
			<div className="grid md:grid-cols-2 gap-4">
				<div className="bg-violet-950/30 border border-violet-800/50 rounded-lg p-4">
					<div className="text-sm text-accent-violet">
						<strong>Hierarchical States:</strong> Parent state "playing"
						contains substates "normal" and "buffering". You can only be in a
						substate when the parent state is active. This models real-world
						constraints.
					</div>
				</div>
				<div className="bg-cyan-950/30 border border-cyan-800/50 rounded-lg p-4">
					<div className="text-sm text-accent-cyan">
						<strong>Parallel States:</strong> Network and audio states run
						independently. The player can be online/offline AND muted/unmuted in
						any combination. 4 possible combinations, all valid.
					</div>
				</div>
			</div>
		</div>
	);
}
