import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

export function WorkerUpdateDemo() {
	const [activeVersion, setActiveVersion] = useState(1);
	const [waitingVersion, setWaitingVersion] = useState<number | null>(null);
	const [controlledTabs, setControlledTabs] = useState(2);
	const [message, setMessage] = useState("Version 1 controls two open tabs.");

	const installUpdate = () => {
		setWaitingVersion(activeVersion + 1);
		setMessage(
			`Version ${activeVersion + 1} installed and waiting while version ${activeVersion} controls open tabs.`,
		);
	};
	const activateUpdate = (takeOver: boolean) => {
		if (waitingVersion === null) return;
		setActiveVersion(waitingVersion);
		setWaitingVersion(null);
		setControlledTabs(takeOver ? 2 : 0);
		setMessage(
			takeOver
				? `Version ${activeVersion + 1} activated immediately and claimed both tabs.`
				: `Version ${activeVersion + 1} activated after the old worker's clients closed.`,
		);
	};

	return (
		<DemoSection
			title="Demo 3: Updates, waiting workers & clients"
			description="A new worker can install in the background while the old version keeps controlling open pages."
		>
			<div className="space-y-5">
				<div className="grid gap-3 md:grid-cols-3">
					<div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
						<div className="text-xs uppercase tracking-wider text-zinc-500">
							Active
						</div>
						<div className="mt-1 text-lg font-semibold text-emerald-300">
							Worker v{activeVersion}
						</div>
						<div className="mt-1 text-xs text-zinc-500">
							{controlledTabs} controlled tabs
						</div>
					</div>
					<div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
						<div className="text-xs uppercase tracking-wider text-zinc-500">
							Waiting
						</div>
						<div className="mt-1 text-lg font-semibold text-amber-300">
							{waitingVersion ? `Worker v${waitingVersion}` : "None"}
						</div>
						<div className="mt-1 text-xs text-zinc-500">
							Waiting workers avoid replacing code mid-session.
						</div>
					</div>
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<div className="text-xs uppercase tracking-wider text-zinc-500">
							User experience
						</div>
						<p className="mt-2 text-sm text-zinc-300" aria-live="polite">
							{message}
						</p>
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						disabled={waitingVersion !== null}
						onClick={installUpdate}
						className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Install update
					</button>
					<button
						type="button"
						disabled={waitingVersion === null}
						onClick={() => activateUpdate(false)}
						className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Wait for tabs to close
					</button>
					<button
						type="button"
						disabled={waitingVersion === null}
						onClick={() => activateUpdate(true)}
						className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-300 disabled:cursor-not-allowed disabled:opacity-40"
					>
						skipWaiting + claim clients
					</button>
				</div>
				<div className="grid gap-3 sm:grid-cols-2 text-xs text-zinc-400">
					<p className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
						<code className="text-amber-300">skipWaiting()</code> lets an
						installed worker move past the waiting state before old pages close.
					</p>
					<p className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
						<code className="text-orange-300">clients.claim()</code> makes the
						activated worker control eligible open pages without waiting for
						another navigation.
					</p>
				</div>
			</div>
		</DemoSection>
	);
}
