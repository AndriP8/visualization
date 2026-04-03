import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useColorScheme } from "../../hooks/useColorScheme";
import { THEME_COLORS } from "../../theme/tokens";

type TabType = "traditional" | "mvcc" | "deadlock";

export function MVCCAndLockingVisualizerDemo() {
	const [activeTab, setActiveTab] = useState<TabType>("mvcc");

	return (
		<div className="flex flex-col gap-6">
			{/* Tabs */}
			<div className="flex flex-wrap gap-2 border-b border-border-primary pb-4">
				<TabButton
					active={activeTab === "traditional"}
					onClick={() => setActiveTab("traditional")}
				>
					Traditional Locking
				</TabButton>
				<TabButton
					active={activeTab === "mvcc"}
					onClick={() => setActiveTab("mvcc")}
				>
					MVCC (Modern Snapshot)
				</TabButton>
				<TabButton
					active={activeTab === "deadlock"}
					onClick={() => setActiveTab("deadlock")}
				>
					Deadlocks
				</TabButton>
			</div>

			{/* Content area */}
			<div className="bg-surface-primary/40 border border-border-primary rounded-lg p-5 min-h-90 flex flex-col justify-center relative overflow-hidden">
				<AnimatePresence mode="wait">
					{activeTab === "traditional" && <TraditionalKey key="trad" />}
					{activeTab === "mvcc" && <MVCCDemo key="mvcc" />}
					{activeTab === "deadlock" && <DeadlockDemo key="deadlock" />}
				</AnimatePresence>
			</div>
		</div>
	);
}

// Helpers

interface TabButtonProps {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={clsx(
				"px-4 py-2 rounded-md text-sm font-semibold transition-all",
				active
					? "bg-violet-600 text-text-primary shadow-[0_0_15px_rgba(124,58,237,0.3)] border border-violet-500"
					: "bg-surface-primary border border-border-primary text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary",
			)}
		>
			{children}
		</button>
	);
}

// ----- Sub Demos -----

function TraditionalKey() {
	const t = THEME_COLORS[useColorScheme()];
	const [step, setStep] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setStep((s) => (s >= 4 ? 0 : s + 1));
		}, 1800);
		return () => clearInterval(timer);
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="space-y-6 w-full max-w-2xl mx-auto"
		>
			<p className="text-sm text-text-tertiary text-center mb-8">
				Older databases (like early SQL Server) secure data by physically
				locking rows.
				<strong className="text-accent-violet-soft block mt-1">
					Writers block everyone. Readers block writers but allow other readers.
				</strong>
			</p>

			<div className="flex justify-between items-center px-8 relative">
				{/* T1 */}
				<div className="w-48 bg-surface-secondary/80 p-3 rounded-lg border border-border-secondary">
					<h5 className="text-accent-violet-soft font-bold mb-2">
						T1 (Reader)
					</h5>
					<div className="text-xs text-text-secondary font-mono space-y-1 h-12">
						{step >= 0 && <div>SELECT balance...</div>}
						{step >= 3 && <div className="text-accent-green-soft">COMMIT;</div>}
					</div>
					<div
						className={clsx(
							"mt-3 text-[10px] uppercase font-bold tracking-widest text-center py-1 rounded",
							step >= 0 && step < 3
								? "bg-amber-500/20 text-accent-amber-soft border border-amber-500/50"
								: "bg-black/20 text-text-faint",
						)}
					>
						Shared Lock
					</div>
				</div>

				{/* The Row */}
				<div className="relative z-10 w-24 h-16 bg-surface-base rounded border border-border-secondary flex flex-col items-center justify-center shadow-lg">
					<div className="absolute -top-3 -right-3">
						<AnimatePresence>
							{step >= 0 && step < 3 && (
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									exit={{ scale: 0 }}
									className="text-2xl filter drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]"
								>
									🔓
								</motion.div>
							)}
							{step >= 4 && (
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									exit={{ scale: 0 }}
									className="text-2xl filter drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]"
								>
									🔒
								</motion.div>
							)}
						</AnimatePresence>
					</div>
					<span className="text-xs text-text-muted">Row 1</span>
					<motion.span
						key={step >= 4 ? "v2" : "v1"}
						initial={{ scale: 1.2, color: "#fff" }}
						animate={{ scale: 1, color: step >= 4 ? "#4ade80" : t.svgText }}
						className="font-mono"
					>
						{step >= 4 ? "$150" : "$100"}
					</motion.span>
				</div>

				{/* T2 */}
				<div className="w-48 bg-surface-secondary/80 p-3 rounded-lg border border-border-secondary">
					<h5 className="text-accent-cyan-soft font-bold mb-2">T2 (Writer)</h5>
					<div className="text-xs text-text-secondary font-mono space-y-1 h-12">
						{step >= 1 && step < 4 && (
							<div className="text-accent-red-soft">UPDATE... (WAITING)</div>
						)}
						{step >= 4 && (
							<div className="text-accent-cyan">UPDATE $150 (OK)</div>
						)}
					</div>
					<div
						className={clsx(
							"mt-3 text-[10px] uppercase font-bold tracking-widest text-center py-1 rounded flex items-center justify-center relative",
							step >= 1 && step < 4
								? "bg-red-500/10 text-red-500 border border-red-500/30 overflow-hidden"
								: step >= 4
									? "bg-red-500/20 text-accent-red-soft border border-red-500/50"
									: "bg-black/20 text-text-faint",
						)}
					>
						{step >= 1 && step < 4 && (
							<motion.div
								className="absolute inset-0 bg-red-500/20"
								animate={{ x: ["-100%", "100%"] }}
								transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
							/>
						)}
						<span className="relative z-10">
							{step >= 1 && step < 4 ? "Blocked" : "Exclusive Lock"}
						</span>
					</div>
				</div>
			</div>

			<div className="text-center font-mono text-xs text-text-muted mt-8">
				Timeline:
				<span className="text-accent-violet-soft mx-2">T1 reads</span> →
				<span className="text-accent-cyan-soft mx-2 text-opacity-50">
					T2 waits
				</span>{" "}
				→<span className="text-accent-violet-soft mx-2">T1 finish</span> →
				<span className="text-accent-cyan-soft mx-2">T2 writes</span>
			</div>
		</motion.div>
	);
}

function MVCCDemo() {
	const [step, setStep] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setStep((s) => (s >= 4 ? 0 : s + 1));
		}, 2000);
		return () => clearInterval(timer);
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="space-y-6 w-full max-w-3xl mx-auto"
		>
			<p className="text-sm text-text-tertiary text-center mb-8">
				In PostgreSQL (MVCC), writers do not block readers. Instead of locks, it
				creates a{" "}
				<strong className="text-accent-violet-soft">
					new version (snapshot)
				</strong>{" "}
				of the row.
			</p>

			<div className="flex justify-between relative px-4 text-center">
				{/* Reader */}
				<div className="w-1/3 p-4">
					<div className="text-sm font-bold text-accent-violet-soft mb-4">
						T1 (Reader) sees:
					</div>
					<AnimatePresence>
						{step >= 0 && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="bg-surface-secondary/80 p-3 rounded border-2 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
							>
								<div className="text-[10px] text-text-muted font-mono mb-2 border-b border-border-secondary pb-1">
									SNAPSHOT (T1_START)
								</div>
								<div className="font-mono text-text-secondary">age: 30</div>
								{step >= 2 && (
									<div className="text-[10px] text-accent-teal-soft mt-2 bg-teal-500/10 py-1 rounded">
										Isolated from T2!
									</div>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* The Disk */}
				<div className="w-1/3 flex flex-col items-center justify-center gap-3">
					<div className="text-xs font-bold uppercase tracking-widest text-text-muted">
						Physical Disk
					</div>

					<div className="relative">
						{/* V1 Row */}
						<motion.div
							animate={{
								y: step >= 2 ? -30 : 0,
								scale: step >= 2 ? 0.9 : 1,
								opacity: step >= 2 ? 0.5 : 1,
							}}
							className="bg-surface-base p-3 rounded border border-border-secondary w-32 shadow-lg relative z-10"
						>
							<div className="text-[10px] text-text-muted mb-1">Row1 (v1)</div>
							<div className="font-mono text-sm">age: 30</div>
						</motion.div>

						{/* V2 Row (Splits off) */}
						<AnimatePresence>
							{step >= 2 && (
								<motion.div
									initial={{ opacity: 0, scale: 0.8, y: -30 }}
									animate={{ opacity: 1, scale: 1, y: 30 }}
									exit={{ opacity: 0, scale: 0.8 }}
									className="bg-surface-base p-3 rounded border-2 border-cyan-500/50 w-32 shadow-lg absolute inset-0 z-20"
								>
									<div className="text-[10px] text-cyan-500 mb-1">
										Row1 (v2)
									</div>
									<div className="font-mono text-sm text-accent-cyan">
										age: 31
									</div>
									<motion.div
										initial={{ width: 0 }}
										animate={{ width: "100%" }}
										className="h-0.5 bg-cyan-500 mt-2"
									/>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>

				{/* Writer */}
				<div className="w-1/3 p-4">
					<div className="text-sm font-bold text-accent-cyan-soft mb-4">
						T2 (Writer) sees:
					</div>
					<AnimatePresence>
						{step >= 1 && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className={clsx(
									"bg-surface-secondary/80 p-3 rounded border-2 transition-colors",
									step >= 2
										? "border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
										: "border-border-secondary",
								)}
							>
								{step === 1 && (
									<div className="text-xs text-accent-yellow-soft font-mono py-4">
										UPDATE starts...
									</div>
								)}
								{step >= 2 && (
									<>
										<div className="text-[10px] text-text-muted font-mono mb-2 border-b border-border-secondary pb-1">
											OWN writes visible
										</div>
										<div className="font-mono text-accent-cyan">age: 31</div>
									</>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>

			<div className="text-center font-mono text-xs mt-12 bg-surface-base p-3 rounded border border-border-primary text-text-tertiary">
				{step === 0 && "T1 begins, taking a snapshot of data."}
				{step === 1 && "T2 begins an update without waiting for T1."}
				{step === 2 &&
					"MVCC magic: T2 creates a new hidden version (V2) instead of overwriting V1."}
				{step === 3 && "T1 continues reading V1 seamlessly. No blocking."}
				{step === 4 &&
					"T2 commits. Later transactions see V2. V1 gets vacuumed later."}
			</div>
		</motion.div>
	);
}

function DeadlockDemo() {
	const [step, setStep] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setStep((s) => (s >= 4 ? 0 : s + 1));
		}, 2000);
		return () => clearInterval(timer);
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="space-y-6 w-full max-w-2xl mx-auto flex flex-col items-center"
		>
			<p className="text-sm text-text-tertiary text-center mb-4 max-w-xl">
				A <strong className="text-accent-red-soft">Deadlock</strong> occurs when
				two transactions wait for locks held by each other. Database deadlock
				detectors automatically pick a "victim" and kill it.
			</p>

			<div className="relative w-96 h-64 bg-surface-primary/50 rounded-lg border border-border-primary">
				{/* Row A */}
				<div
					className={clsx(
						"absolute top-4 left-1/2 -ml-10 w-20 h-10 rounded border flex items-center justify-center font-mono text-xs transition-colors",
						step >= 1 && step < 5
							? "bg-violet-500/10 border-violet-500 text-accent-violet shadow-[0_0_10px_rgba(139,92,246,0.3)]"
							: "bg-surface-base border-border-secondary text-text-muted",
					)}
				>
					Row A
					{step >= 1 && step < 5 && (
						<span className="absolute -top-3 text-lg drop-shadow">🔒</span>
					)}
				</div>

				{/* Row B */}
				<div
					className={clsx(
						"absolute bottom-4 left-1/2 -ml-10 w-20 h-10 rounded border flex items-center justify-center font-mono text-xs transition-colors",
						step >= 2 && step < 4
							? "bg-cyan-500/10 border-cyan-500 text-accent-cyan shadow-[0_0_10px_rgba(6,182,212,0.3)]"
							: step === 4
								? "bg-violet-500/10 border-violet-500 text-accent-violet shadow-[0_0_10px_rgba(139,92,246,0.3)]"
								: "bg-surface-base border-border-secondary text-text-muted",
					)}
				>
					Row B
					{step >= 2 && step <= 4 && (
						<span className="absolute -bottom-3 text-lg drop-shadow">🔒</span>
					)}
				</div>

				{/* T1 */}
				<div className="absolute top-1/2 -mt-6 left-4 bg-surface-secondary p-2 rounded border border-border-tertiary w-24 text-center">
					<div className="text-accent-violet-soft font-bold text-sm">T1</div>
				</div>

				{/* T2 */}
				<div className="absolute top-1/2 -mt-6 right-4 bg-surface-secondary p-2 rounded border border-border-tertiary w-24 text-center">
					<div
						className={clsx(
							"font-bold text-sm transition-colors",
							step === 4 ? "text-red-500" : "text-accent-cyan-soft",
						)}
					>
						{step === 4 ? "☠️ KILLED" : "T2"}
					</div>
				</div>

				{/* Connections */}
				<svg
					className="absolute inset-0 w-full h-full pointer-events-none"
					style={{ zIndex: 0 }}
				>
					<title>Connections</title>
					<defs>
						<marker
							id="arrowHead-v"
							markerWidth="10"
							markerHeight="10"
							refX="9"
							refY="3"
							orient="auto"
						>
							<path d="M0,0 L0,6 L9,3 z" fill="#8b5cf6" />
						</marker>
						<marker
							id="arrowHead-c"
							markerWidth="10"
							markerHeight="10"
							refX="9"
							refY="3"
							orient="auto"
						>
							<path d="M0,0 L0,6 L9,3 z" fill="#06b6d4" />
						</marker>
						<marker
							id="arrowHead-c-wait"
							markerWidth="10"
							markerHeight="10"
							refX="9"
							refY="3"
							orient="auto"
						>
							<path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
						</marker>
						<marker
							id="arrowHead-v-wait"
							markerWidth="10"
							markerHeight="10"
							refX="9"
							refY="3"
							orient="auto"
						>
							<path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
						</marker>
					</defs>

					{/* T1 locks Row A */}
					{step >= 1 && step < 5 && (
						<path
							d="M110,120 C110,80 150,40 170,40"
							fill="none"
							stroke="#8b5cf6"
							strokeWidth="2"
							strokeDasharray="4 4"
							markerEnd="url(#arrowHead-v)"
						/>
					)}

					{/* T2 locks Row B */}
					{step >= 2 && step < 4 && (
						<path
							d="M270,140 C270,180 230,220 210,220"
							fill="none"
							stroke="#06b6d4"
							strokeWidth="2"
							strokeDasharray="4 4"
							markerEnd="url(#arrowHead-c)"
						/>
					)}

					{/* T1 wants Row B — blocked at step 3, acquired at step 4 */}
					{step === 3 && (
						<g>
							<path
								d="M110,140 C110,180 150,220 170,220"
								fill="none"
								stroke="#ef4444"
								strokeWidth="3"
								markerEnd="url(#arrowHead-v-wait)"
							/>
							<circle cx="140" cy="180" r="4" fill="#ef4444">
								<animate
									attributeName="opacity"
									values="1;0.2;1"
									dur="1s"
									repeatCount="indefinite"
								/>
							</circle>
						</g>
					)}
					{step === 4 && (
						<path
							d="M110,140 C110,180 150,220 170,220"
							fill="none"
							stroke="#8b5cf6"
							strokeWidth="2"
							strokeDasharray="4 4"
							markerEnd="url(#arrowHead-v)"
						/>
					)}

					{/* T2 wants Row A */}
					{step >= 3 && step < 4 && (
						<g>
							<path
								d="M270,120 C270,80 230,40 210,40"
								fill="none"
								stroke="#ef4444"
								strokeWidth="3"
								markerEnd="url(#arrowHead-c-wait)"
							/>
							<circle cx="240" cy="80" r="4" fill="#ef4444">
								<animate
									attributeName="opacity"
									values="1;0.2;1"
									dur="1s"
									repeatCount="indefinite"
								/>
							</circle>
						</g>
					)}
				</svg>

				{/* Deadlock overlay */}
				<AnimatePresence>
					{step === 3 && (
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.8, opacity: 0 }}
							className="absolute top-1/2 left-1/2 -mt-10 -ml-24 w-48 bg-red-500/90 text-text-primary p-2 rounded shadow-2xl text-center border-2 border-red-300 z-50"
						>
							<div className="font-bold text-sm">⚠️ DEADLOCK</div>
							<div className="text-[10px] opacity-80 mt-1">
								Both transactions wait infinitely. DB must kill one.
							</div>
						</motion.div>
					)}
					{step === 4 && (
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.8, opacity: 0 }}
							className="absolute top-1/2 right-4 -mt-14 mr-2 bg-red-950/90 text-red-200 border border-red-800 p-2 rounded shadow-2xl text-center z-50 text-[10px]"
						>
							Transaction aborted due to
							<br />
							deadlock detection.
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className="w-full bg-surface-base border border-border-primary rounded p-2 text-center text-xs text-text-tertiary font-mono">
				{step === 0 && "Idle state"}
				{step === 1 && "T1 locks Row A"}
				{step === 2 && "T2 locks Row B"}
				{step === 3 && (
					<span className="text-accent-red-soft">
						T1 requests Row B (Blocked) &amp; T2 requests Row A (Blocked) {"->"}
						DEADLOCK CYCLE!
					</span>
				)}
				{step === 4 && (
					<span className="text-accent-yellow-soft">
						DB Deadlock Detector kicks in: Kills T2. T1 proceeds.
					</span>
				)}
			</div>
		</motion.div>
	);
}
