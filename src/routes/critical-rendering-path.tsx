import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ParsingPipelineDemo } from "../components/critical-rendering-path/ParsingPipelineDemo";
import { ReflowRepaintDemo } from "../components/critical-rendering-path/ReflowRepaintDemo";
import { RenderBlockingDemo } from "../components/critical-rendering-path/RenderBlockingDemo";
import { RenderTreeDemo } from "../components/critical-rendering-path/RenderTreeDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/critical-rendering-path")({
	component: CriticalRenderingPathPage,
});

function CriticalRenderingPathPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Browser Fundamentals", color: "amber" }}
				title="Critical Rendering Path"
				subtitle="How the browser turns HTML & CSS bytes into pixels on screen."
				gradient={{ from: "amber-400", to: "orange-400" }}
				explanation={{
					content: (
						<div className="text-sm text-text-muted space-y-2">
							<p>
								<strong className="text-text-secondary">The pipeline:</strong>{" "}
								When the browser receives an HTML document, it goes through a
								multi-stage pipeline before anything appears on screen:
							</p>
							<ol className="list-decimal list-inside space-y-1 text-text-tertiary">
								<li>
									<strong className="text-accent-amber-soft">Parse</strong> —
									Bytes → Characters → Tokens → Nodes → DOM Tree
								</li>
								<li>
									<strong className="text-accent-amber-soft">Style</strong> —
									CSS bytes → CSSOM Tree
								</li>
								<li>
									<strong className="text-accent-amber-soft">
										Render Tree
									</strong>{" "}
									— DOM + CSSOM merged (only visible nodes)
								</li>
								<li>
									<strong className="text-accent-amber-soft">Layout</strong> —
									Compute geometry (position, size)
								</li>
								<li>
									<strong className="text-accent-amber-soft">Paint</strong> —
									Fill in pixels (colors, borders, shadows)
								</li>
								<li>
									<strong className="text-accent-amber-soft">Composite</strong>{" "}
									— Layer composition on GPU
								</li>
							</ol>
							<p className="text-text-muted">
								The browser{" "}
								<strong className="text-text-secondary">
									renders progressively
								</strong>{" "}
								— it wants to paint as early as possible, but must wait for the{" "}
								<strong className="text-accent-orange-soft">
									minimum critical resources
								</strong>{" "}
								(CSS in {"<head>"}, synchronous JS) before{" "}
								<strong className="text-accent-orange-soft">First Paint</strong>
								.
							</p>
						</div>
					),
				}}
			/>

			{/* Demos */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<ParsingPipelineDemo />
				<RenderTreeDemo />
				<ReflowRepaintDemo />
				<RenderBlockingDemo />
			</motion.div>
		</div>
	);
}
