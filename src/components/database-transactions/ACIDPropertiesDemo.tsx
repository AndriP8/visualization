import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface ButtonProps {
	onClick?: () => void;
	disabled?: boolean;
	active?: boolean;
	className?: string;
	children: React.ReactNode;
}

const Button = ({
	onClick,
	disabled,
	active,
	className,
	children,
}: ButtonProps) => (
	<button
		type="button"
		disabled={disabled}
		onClick={onClick}
		className={clsx(
			"px-3 py-1.5 rounded-md text-sm font-medium transition-colors z-10",
			disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-700",
			active ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-300",
			className,
		)}
	>
		{children}
	</button>
);

interface CardProps {
	title: string;
	description: string;
	tooltip?: string;
	children: React.ReactNode;
}

const Card = ({ title, description, children, tooltip }: CardProps) => (
	<div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 flex flex-col h-full relative">
		<div className="flex justify-between items-start mb-2">
			<h4 className="text-md font-bold text-zinc-100">{title}</h4>
			{tooltip && (
				<div className="relative flex items-center group">
					<span className="text-zinc-500 hover:text-zinc-300 cursor-help text-sm">
						ℹ️
					</span>
					<div className="absolute right-0 top-6 w-56 p-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
						{tooltip}
					</div>
				</div>
			)}
		</div>
		<p className="text-sm text-zinc-400 mb-4 flex-1">{description}</p>
		<div className="mt-auto bg-black/40 rounded border border-zinc-800/50 p-4 min-h-40 flex flex-col justify-center relative overflow-hidden">
			{children}
		</div>
	</div>
);

// ----- Demos -----

function AtomicityDemo() {
	const [state, setState] = useState<
		"idle" | "start" | "deduct" | "crash" | "commit" | "rollback"
	>("idle");
	const [shouldCrash, setShouldCrash] = useState(false);

	const alice =
		state === "idle" || state === "start" || state === "rollback" ? 100 : 50;
	const bob = state === "commit" ? 50 : 0;

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout>;
		if (state === "start") {
			timeout = setTimeout(() => setState("deduct"), 800);
		} else if (state === "deduct") {
			timeout = setTimeout(
				() => setState(shouldCrash ? "crash" : "commit"),
				800,
			);
		} else if (state === "crash") {
			timeout = setTimeout(() => setState("rollback"), 1200);
		} else if (state === "commit" || state === "rollback") {
			timeout = setTimeout(() => setState("idle"), 2500);
		}
		return () => clearTimeout(timeout);
	}, [state, shouldCrash]);

	return (
		<div className="space-y-4">
			<div className="flex gap-4 justify-center relative z-0">
				<div className="text-center">
					<div className="text-xs text-zinc-500 mb-1">Alice</div>
					<motion.div
						key={`alice-${alice}`}
						initial={{ scale: 1.2, color: "#fff" }}
						animate={{ scale: 1, color: alice === 100 ? "#a1a1aa" : "#f87171" }}
						className="text-2xl font-mono"
					>
						${alice}
					</motion.div>
				</div>
				<div className="text-zinc-600 self-center">{"->"}</div>
				<div className="text-center">
					<div className="text-xs text-zinc-500 mb-1">Bob</div>
					<motion.div
						key={`bob-${bob}`}
						initial={{ scale: 1.2, color: "#fff" }}
						animate={{ scale: 1, color: bob === 50 ? "#4ade80" : "#a1a1aa" }}
						className="text-2xl font-mono"
					>
						${bob}
					</motion.div>
				</div>
			</div>

			<div className="h-6 text-center text-xs font-mono">
				{state === "start" && <span className="text-blue-400">BEGIN;</span>}
				{state === "deduct" && (
					<span className="text-yellow-400">
						UPDATE alice...{" "}
						<span className="text-zinc-500">(uncommitted, $50 in-flight)</span>
					</span>
				)}
				{state === "crash" && (
					<span className="text-red-500 font-bold">💥 SYSTEM CRASH</span>
				)}
				{state === "rollback" && (
					<span className="text-red-400">ROLLBACK (Recovered)</span>
				)}
				{state === "commit" && (
					<span className="text-green-400">COMMIT; ✅</span>
				)}
			</div>

			<div className="flex justify-between items-center">
				<label className="flex items-center text-xs gap-2 cursor-pointer z-10 text-zinc-400 hover:text-zinc-200">
					<input
						type="checkbox"
						checked={shouldCrash}
						onChange={(e) => setShouldCrash(e.target.checked)}
						className="accent-red-500"
					/>
					Will Crash
				</label>
				<Button onClick={() => setState("start")} disabled={state !== "idle"}>
					Transfer $50
				</Button>
			</div>
		</div>
	);
}

function ConsistencyDemo() {
	const [status, setStatus] = useState<
		"idle" | "checking" | "rejected" | "approved"
	>("idle");

	const tryWithdraw = () => setStatus("checking");

	useEffect(() => {
		if (status === "checking") {
			const timer = setTimeout(() => setStatus("rejected"), 1000);
			return () => clearTimeout(timer);
		}
		if (status === "rejected") {
			const timer = setTimeout(() => setStatus("idle"), 2000);
			return () => clearTimeout(timer);
		}
	}, [status]);

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center bg-zinc-800/50 p-3 rounded border border-zinc-700">
				<span className="text-xs text-zinc-400">Balance</span>
				<motion.span
					key={status}
					initial={{ color: "#fff" }}
					animate={{ color: status === "rejected" ? "#f87171" : "#a1a1aa" }}
					className="font-mono text-xl"
				>
					$100
				</motion.span>
			</div>

			<div className="h-8 flex items-center justify-center">
				<AnimatePresence mode="wait">
					{status === "idle" && (
						<motion.span
							key="idle"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="text-xs text-zinc-500 font-mono"
						>
							CHECK: balance &gt;= 0
						</motion.span>
					)}
					{status === "checking" && (
						<motion.span
							key="checking"
							initial={{ opacity: 0, y: 5 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -5 }}
							className="text-xs text-yellow-400 font-mono"
						>
							Validating withdraw $150...
						</motion.span>
					)}
					{status === "rejected" && (
						<motion.span
							key="rejected"
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0 }}
							className="text-xs text-red-500 font-mono font-bold"
						>
							❌ Constraint Violation!
						</motion.span>
					)}
				</AnimatePresence>
			</div>

			<div className="flex justify-end">
				<Button onClick={tryWithdraw} disabled={status !== "idle"}>
					Withdraw $150
				</Button>
			</div>
		</div>
	);
}

function IsolationDemo() {
	const [active, setActive] = useState(false);
	const [ticks, setTicks] = useState(0);

	useEffect(() => {
		if (!active) {
			setTicks(0);
			return;
		}
		const timer = setInterval(() => {
			setTicks((t) => t + 1);
		}, 600);
		return () => clearInterval(timer);
	}, [active]);

	useEffect(() => {
		if (ticks >= 8) {
			setActive(false);
		}
	}, [ticks]);

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-2 relative">
				{/* T1 */}
				<div className="bg-zinc-800/80 border border-zinc-700 rounded p-2 flex items-center gap-3">
					<span className="text-xs font-bold text-violet-400 w-6">T1</span>
					<div className="h-2 flex-1 bg-zinc-900 rounded overflow-hidden">
						<motion.div
							className="h-full bg-violet-500"
							initial={{ width: "0%" }}
							animate={{
								width:
									ticks >= 1 && ticks < 4 ? "50%" : ticks >= 4 ? "100%" : "0%",
							}}
							transition={{ duration: 0.3 }}
						/>
					</div>
					<span className="text-xs text-zinc-500 w-16 text-right">
						{ticks >= 4 ? "Commit" : ticks >= 1 ? "Running" : "Wait"}
					</span>
				</div>
				{/* T2 */}
				<div className="bg-zinc-800/80 border border-zinc-700 rounded p-2 flex items-center gap-3">
					<span className="text-xs font-bold text-cyan-400 w-6">T2</span>
					<div className="h-2 flex-1 bg-zinc-900 rounded overflow-hidden">
						<motion.div
							className="h-full bg-cyan-500"
							initial={{ width: "0%" }}
							animate={{ width: ticks >= 3 ? "100%" : "0%" }}
							transition={{ duration: 0.3 }}
						/>
					</div>
					<span className="text-xs text-zinc-500 w-16 text-right">
						{ticks >= 3 ? "Commit" : "Wait"}
					</span>
				</div>

				{/* Interleaving indicator */}
				<div className="absolute inset-0 flex justify-center items-center pointer-events-none">
					<AnimatePresence>
						{ticks === 2 && (
							<motion.div
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0 }}
								className="bg-black/80 px-2 py-1 rounded text-[10px] text-yellow-400 border border-yellow-500/30 font-mono shadow-lg"
							>
								Concurrent Read/Write!
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>

			<div className="flex justify-between items-center">
				<span className="text-xs text-zinc-500">Executes left-to-right</span>
				<Button onClick={() => setActive(true)} disabled={active}>
					Run Concurrently
				</Button>
			</div>
		</div>
	);
}

function DurabilityDemo() {
	const [status, setStatus] = useState<
		"idle" | "writing" | "committed" | "crash" | "recovering" | "recovered"
	>("idle");

	const start = () => setStatus("writing");

	useEffect(() => {
		if (status === "writing") {
			const timer = setTimeout(() => setStatus("committed"), 1000);
			return () => clearTimeout(timer);
		}
		if (status === "committed") {
			const timer = setTimeout(() => setStatus("crash"), 1000);
			return () => clearTimeout(timer);
		}
		if (status === "crash") {
			const timer = setTimeout(() => setStatus("recovering"), 1500);
			return () => clearTimeout(timer);
		}
		if (status === "recovering") {
			const timer = setTimeout(() => setStatus("recovered"), 1500);
			return () => clearTimeout(timer);
		}
		if (status === "recovered") {
			const timer = setTimeout(() => setStatus("idle"), 2500);
			return () => clearTimeout(timer);
		}
	}, [status]);

	return (
		<div className="space-y-4">
			<div className="flex gap-4">
				{/* Disk representation */}
				<div className="flex-1 border border-zinc-700 rounded bg-zinc-800/50 p-3 h-16 flex flex-col justify-center items-center relative overflow-hidden">
					<span className="text-[10px] text-zinc-500 absolute top-1 left-2">
						WAL (Disk)
					</span>
					<AnimatePresence mode="wait">
						{(status === "idle" || status === "writing") && (
							<motion.span key="empty" className="text-xs text-zinc-600">
								No pending logs
							</motion.span>
						)}
						{status === "committed" && (
							<motion.span
								key="saved"
								initial={{ y: -10, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								className="text-xs text-green-400 font-mono font-bold"
							>
								1Log: UPDATE ok!
							</motion.span>
						)}
						{status === "crash" && (
							<motion.div
								key="crash"
								className="absolute inset-0 bg-red-500/20 flex items-center justify-center backdrop-blur-[1px]"
							>
								<span className="text-xs text-red-500 font-bold">
									POWER LOSS
								</span>
							</motion.div>
						)}
						{(status === "recovering" || status === "recovered") && (
							<motion.span
								key="recovered"
								className="text-xs text-green-400 font-mono font-bold"
							>
								1Log: UPDATE ok!
							</motion.span>
						)}
					</AnimatePresence>
				</div>
			</div>

			<div className="h-6 text-center text-xs font-mono">
				{status === "writing" && (
					<span className="text-yellow-400">Memory updated...</span>
				)}
				{status === "committed" && (
					<span className="text-green-400">Written to WAL & Committed</span>
				)}
				{status === "crash" && (
					<span className="text-red-500 invisible">Crash</span>
				)}
				{status === "recovering" && (
					<span className="text-blue-400">DB Reboot: Replaying WAL...</span>
				)}
				{status === "recovered" && (
					<span className="text-green-400">Data completely restored!</span>
				)}
			</div>

			<div className="flex justify-end">
				<Button onClick={start} disabled={status !== "idle"}>
					Commit Data
				</Button>
			</div>
		</div>
	);
}

export function ACIDPropertiesDemo() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card
					title="Atomicity"
					description='The "All or Nothing" rule. If a transaction fails halfway through, all partial changes are completely undone (rolled back) so the database is never left in an invalid middle state.'
				>
					<AtomicityDemo />
				</Card>

				<Card
					title="Consistency"
					description="Transactions must only transition the database from one valid state to another valid state, respecting all defined rules."
					tooltip="Unlike Atomicity/Durability which are hard DB system properties, Consistency is generally considered an application-level responsibility enforced via CHECK constraints, Triggers, or Application logic."
				>
					<ConsistencyDemo />
				</Card>

				<Card
					title="Isolation"
					description="Concurrent transactions executing at the same time must behave as if they were executing strictly sequentially one after another. No stepping on toes."
					tooltip="Isolation is deeply linked to Concurrency Anomalies and Isolation Levels (explored below). True 'Serializable' isolation is rarely used perfectly due to performance costs."
				>
					<IsolationDemo />
				</Card>

				<Card
					title="Durability"
					description="Once a transaction is committed, it stays committed. Even in the event of a power loss, crash, or fatal error, the data is safe on non-volatile storage."
					tooltip="Typically achieved using a Write-Ahead Log (WAL). Changes are quickly appended to the WAL on disk before the slower process of modifying the actual database files."
				>
					<DurabilityDemo />
				</Card>
		</div>
	);
}
