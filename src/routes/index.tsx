import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";

export const Route = createFileRoute("/")({
	component: Index,
});

const CONCEPT_GROUPS = [
	{
		title: "React",
		description: "Deep dive into React's internal workings",
		items: [
			{
				to: "/reconciliation" as const,
				title: "Reconciliation",
				icon: "🌳",
				description:
					"How React diffs the virtual tree and decides what to update in the real DOM.",
				tags: ["Fiber", "Diffing", "Keys", "Phases"],
				color: "from-violet-500/20 to-purple-500/20",
				borderColor: "border-violet-500/30",
			},
		],
	},
	{
		title: "Browser",
		description: "How browsers transform code into pixels on screen",
		items: [
			{
				to: "/critical-rendering-path" as const,
				title: "Critical Rendering Path",
				icon: "🎨",
				description:
					"How the browser converts HTML & CSS into rendered pixels — parsing, CSSOM, layout, paint, and compositing.",
				tags: ["DOM", "CSSOM", "Layout", "Paint"],
				color: "from-amber-500/20 to-orange-500/20",
				borderColor: "border-amber-500/30",
			},
		],
	},
];

function Index() {
	return (
		<div className="max-w-4xl mx-auto">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<h2 className="text-3xl font-bold mb-2">
					Web Concepts{" "}
					<span className="bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
						Under the Hood
					</span>
				</h2>
				<p className="text-zinc-400 mb-8 text-lg">
					Interactive visualizations to understand how web technologies actually
					work.
				</p>
			</motion.div>

			<div className="space-y-12">
				{CONCEPT_GROUPS.map((group, groupIndex) => (
					<div key={group.title}>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.1 + groupIndex * 0.1 }}
							className="mb-4"
						>
							<h3 className="text-xl font-bold text-white mb-1">
								{group.title}
							</h3>
							<p className="text-zinc-400 text-sm">{group.description}</p>
						</motion.div>

						<div className="grid gap-4 sm:grid-cols-2">
							{group.items.map((concept, i) => (
								<motion.div
									key={concept.to}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										duration: 0.4,
										delay: 0.2 + groupIndex * 0.1 + i * 0.1,
									}}
								>
									<Link
										to={concept.to}
										className={`
											block p-5 rounded-xl border ${concept.borderColor}
											bg-linear-to-br ${concept.color}
											hover:scale-[1.02] transition-transform duration-200
											group
										`}
									>
										<div className="text-2xl mb-3">{concept.icon}</div>
										<h3 className="text-lg font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">
											{concept.title}
										</h3>
										<p className="text-sm text-zinc-400 mb-3">
											{concept.description}
										</p>
										<div className="flex flex-wrap gap-1.5">
											{concept.tags.map((tag) => (
												<span
													key={tag}
													className="px-2 py-0.5 text-xs rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/50"
												>
													{tag}
												</span>
											))}
										</div>
									</Link>
								</motion.div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
