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
				topic={{ label: "Browser Fundamentals", color: "orange" }}
				title="Critical Rendering Path"
				subtitle="How the browser turns HTML & CSS bytes into pixels on screen."
				gradient={{ from: "orange-400", to: "amber-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Before a single pixel appears, the browser runs a six-stage
								pipeline: parse HTML into a DOM, parse CSS into a CSSOM, merge
								them into a{" "}
								<span className="text-amber-300 font-medium">Render Tree</span>,
								compute geometry in{" "}
								<span className="text-orange-300 font-medium">Layout</span>,
								fill pixels in Paint, then composite layers on the GPU. The
								pipeline is eager — the browser wants to paint as early as
								possible — but it is blocked by any{" "}
								<span className="text-amber-300 font-medium">
									render-blocking resource
								</span>{" "}
								(CSS in <code>{"<head>"}</code>, synchronous scripts) before
								First Paint.
							</p>
							<p>
								Reflow (layout recalculation) and repaint are the most expensive
								operations in an interactive page because they can cascade — one
								DOM change can invalidate geometry for thousands of elements.
								Understanding which CSS properties trigger layout, paint, or
								composite-only changes is the difference between 60 fps and
								jank.
							</p>
							<p className="text-zinc-400">
								The demos below cover the parsing pipeline, render tree
								construction, reflow and repaint triggers, and render-blocking
								resource impact.
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
