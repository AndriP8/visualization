import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, useTransition } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Mode = "without" | "with";
type Tab = "posts" | "photos" | "charts";

interface TabConfig {
	label: string;
	count: number;
	burnPerItem: number;
	activeBg: string;
	activeText: string;
	activeBorder: string;
}

const TABS: Record<Tab, TabConfig> = {
	posts: {
		label: "Posts",
		count: 50,
		burnPerItem: 10,
		activeBg: "bg-emerald-500/20",
		activeText: "text-emerald-400",
		activeBorder: "border-emerald-500/30",
	},
	photos: {
		label: "Photos",
		count: 500,
		burnPerItem: 50,
		activeBg: "bg-blue-500/20",
		activeText: "text-blue-400",
		activeBorder: "border-blue-500/30",
	},
	charts: {
		label: "Charts",
		count: 2000,
		burnPerItem: 100,
		activeBg: "bg-amber-500/20",
		activeText: "text-amber-400",
		activeBorder: "border-amber-500/30",
	},
};

function HeavyContent({ tab }: { tab: Tab }) {
	const config = TABS[tab];

	const items = useMemo(() => {
		const result: string[] = [];
		for (let i = 0; i < config.count; i++) {
			// CPU burn loop
			let sum = 0;
			for (let j = 0; j < config.burnPerItem; j++) {
				sum += Math.sqrt(j * i + 1);
			}
			result.push(`${config.label} item ${i + 1} (${sum.toFixed(0)})`);
		}
		return result;
	}, [config.count, config.burnPerItem, config.label]);

	return (
		<div className="h-52 overflow-y-auto rounded-lg bg-zinc-800/50 border border-zinc-700/50">
			{items.map((item) => (
				<div
					key={item}
					className="px-3 py-1.5 text-sm text-zinc-300 border-b border-zinc-800/50 last:border-b-0"
				>
					{item}
				</div>
			))}
		</div>
	);
}

export function TransitionDemo() {
	const [mode, setMode] = useState<Mode>("without");
	const [activeTab, setActiveTab] = useState<Tab>("posts");
	const [pendingTab, setPendingTab] = useState<Tab | null>(null);
	const [isPending, startTransition] = useTransition();

	function handleTabChange(tab: Tab) {
		if (mode === "with") {
			setPendingTab(tab);
			startTransition(() => {
				setActiveTab(tab);
			});
		} else {
			setActiveTab(tab);
		}
	}

	// Clear pendingTab once the transition completes
	if (!isPending && pendingTab !== null) {
		setPendingTab(null);
	}

	return (
		<DemoSection
			title="useTransition — Low-Priority Updates"
			description="Switch between tabs with different render costs. With useTransition, heavy tab switches don't freeze the UI."
		>
			<div className="space-y-6">
				{/* Mode Toggle */}
				<div className="flex items-center justify-between">
					<div className="flex bg-zinc-800 rounded-lg p-1">
						<button
							type="button"
							onClick={() => setMode("without")}
							className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
								mode === "without"
									? "bg-red-500/20 text-red-400"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							Without useTransition
						</button>
						<button
							type="button"
							onClick={() => setMode("with")}
							className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
								mode === "with"
									? "bg-emerald-500/20 text-emerald-400"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							With useTransition
						</button>
					</div>

					{isPending && mode === "with" && (
						<motion.span
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30"
						>
							isPending: true
						</motion.span>
					)}
				</div>

				{/* Timeline Visualization */}
				<div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
					<h4 className="text-sm font-medium text-zinc-300">
						What happens when you click "Charts"
					</h4>
					<AnimatePresence mode="wait">
						{mode === "without" ? (
							<motion.div
								key="without"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="space-y-2"
							>
								<div className="flex items-center gap-2 text-xs text-zinc-400">
									<span className="w-20 shrink-0">Without</span>
									<div className="flex-1 flex h-8 rounded overflow-hidden">
										<div className="bg-violet-500/30 border border-violet-500/50 flex items-center justify-center text-[10px] text-violet-300 w-[10%]">
											Click
										</div>
										<motion.div
											className="bg-red-500/30 border border-red-500/50 flex items-center justify-center text-[10px] text-red-300 w-[75%]"
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.5 }}
										>
											Render 2000 items (frozen)
										</motion.div>
										<div className="bg-zinc-600/50 flex items-center justify-center text-[10px] text-zinc-400 w-[15%]">
											Done
										</div>
									</div>
								</div>
							</motion.div>
						) : (
							<motion.div
								key="with"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="space-y-2"
							>
								<div className="flex items-center gap-2 text-xs text-zinc-400">
									<span className="w-20 shrink-0">With</span>
									<div className="flex-1 flex h-8 rounded overflow-hidden gap-0.5">
										<div className="bg-violet-500/30 border border-violet-500/50 flex items-center justify-center text-[10px] text-violet-300 w-[10%]">
											Click
										</div>
										<motion.div
											className="bg-amber-500/30 border border-amber-500/50 flex items-center justify-center text-[10px] text-amber-300 w-[25%]"
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.3, delay: 0.1 }}
										>
											isPending
										</motion.div>
										<motion.div
											className="bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center text-[10px] text-emerald-300 w-[50%]"
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.4, delay: 0.3 }}
										>
											Low-priority render (can yield to input)
										</motion.div>
										<motion.div
											className="bg-zinc-600/50 flex items-center justify-center text-[10px] text-zinc-400 w-[15%]"
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.2, delay: 0.6 }}
										>
											Swap
										</motion.div>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Tab Bar */}
				<div className="flex gap-2">
					{(Object.entries(TABS) as [Tab, TabConfig][]).map(([key, config]) => (
						<button
							key={key}
							type="button"
							onClick={() => handleTabChange(key)}
							className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
								activeTab === key
									? `${config.activeBg} ${config.activeText} border ${config.activeBorder}`
									: "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
							}`}
						>
							{isPending && mode === "with" && pendingTab === key && (
								<span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
							)}
							{config.label}
							<span className="ml-2 text-xs text-zinc-500">
								({config.count})
							</span>
						</button>
					))}
				</div>

				{/* Content */}
				<div
					className={`transition-opacity duration-200 ${
						isPending && mode === "with" ? "opacity-60" : "opacity-100"
					}`}
				>
					<HeavyContent tab={activeTab} />
				</div>

				{/* Distinction callout */}
				<div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-4">
					<p className="text-sm text-violet-300">
						<span className="font-semibold">useTransition</span> wraps the{" "}
						<em>state update</em>.{" "}
						<span className="font-semibold">useDeferredValue</span> wraps the{" "}
						<em>value</em> (useful when you don't own the state setter).
					</p>
				</div>

				{/* Code Example */}
				<ShikiCode
					language="tsx"
					code={`const [isPending, startTransition] = useTransition();

function handleTabChange(tab: string) {
  startTransition(() => {
    // Marked as non-urgent — React can interrupt this
    setActiveTab(tab);
  });
}

return (
  <button onClick={() => handleTabChange('charts')}>
    {isPending ? <Spinner /> : null}
    Charts
  </button>
);`}
					showLineNumbers={false}
					className="text-xs"
				/>
			</div>
		</DemoSection>
	);
}
