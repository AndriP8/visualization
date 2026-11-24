import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

type Pos = { x: number; y: number };

const NODE_SIZE = 44;
const TRANSITION = { duration: 0.8, ease: "easeInOut" } as const;

// Node centers for each state, keyed by value.
const SKEWED: Record<number, Pos> = {
	3: { x: 185, y: 45 },
	2: { x: 110, y: 130 },
	1: { x: 50, y: 215 },
};
const ROTATED: Record<number, Pos> = {
	2: { x: 120, y: 45 },
	1: { x: 55, y: 165 },
	3: { x: 185, y: 165 },
};

// Both edges exist in both states, so they glide along with the nodes.
const EDGES = [
	[3, 2],
	[2, 1],
] as const;

function Edge({ from, to }: { from: Pos; to: Pos }) {
	return (
		<motion.div
			className="absolute h-px bg-zinc-600"
			style={{ transformOrigin: "0 0" }}
			animate={{
				left: from.x,
				top: from.y,
				width: Math.hypot(to.x - from.x, to.y - from.y),
				rotate: (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI,
			}}
			transition={TRANSITION}
		/>
	);
}

export function RotationDemo() {
	const [rotated, setRotated] = useState(false);
	const positions = rotated ? ROTATED : SKEWED;

	return (
		<DemoSection
			title="How trees stay balanced: rotations"
			description="The chain 3 → 2 → 1 leans hard to the left. A right rotation lifts node 2 up to become the parent and drops node 3 down one level to become 2's right child. The in-order visit is 1 → 2 → 3 before and after, so the sorted order never changes."
		>
			<div className="space-y-5">
				<div className="flex justify-center">
					<button
						type="button"
						onClick={() => setRotated((state) => !state)}
						className="rounded-lg border border-cyan-500/30 bg-cyan-600/20 px-4 py-1.5 text-sm text-cyan-300"
					>
						{rotated ? "Rotate back" : "Rotate right"}
					</button>
				</div>
				<div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-5">
					<div className="relative mx-auto h-[240px] w-[260px]">
						{EDGES.map(([a, b]) => (
							<Edge key={`${a}-${b}`} from={positions[a]} to={positions[b]} />
						))}
						{[3, 2, 1].map((nodeValue) => (
							<motion.div
								key={nodeValue}
								className={`absolute flex items-center justify-center rounded-full border font-mono text-sm ${
									nodeValue === 2
										? "border-cyan-500/50 bg-cyan-500/15 text-cyan-200"
										: "border-purple-500/40 bg-purple-500/15 text-purple-200"
								}`}
								animate={{
									left: positions[nodeValue].x - NODE_SIZE / 2,
									top: positions[nodeValue].y - NODE_SIZE / 2,
								}}
								transition={TRANSITION}
								style={{ width: NODE_SIZE, height: NODE_SIZE }}
							>
								{nodeValue}
							</motion.div>
						))}
					</div>
				</div>
				<p className="text-sm text-zinc-400">
					In-order visit:{" "}
					<span className="font-mono text-purple-300">1 → 2 → 3</span>
					<span className="ml-2 text-xs text-zinc-500">
						same before and after — no sorted order is lost
					</span>
				</p>
				<p className="text-sm text-zinc-400">
					A rotation is just lifting one child up and dropping the old parent
					down one level. AVL and red-black trees run a few of these after each
					insert or delete, which is what keeps every leaf close to the root.
				</p>
			</div>
		</DemoSection>
	);
}
