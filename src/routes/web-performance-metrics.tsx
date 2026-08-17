import { createFileRoute } from "@tanstack/react-router";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";
import CLSDemo from "../components/web-performance-metrics/CLSDemo";
import FCPDemo from "../components/web-performance-metrics/FCPDemo";
import INPDemo from "../components/web-performance-metrics/INPDemo";
import LCPDemo from "../components/web-performance-metrics/LCPDemo";
import TTFBDemo from "../components/web-performance-metrics/TTFBDemo";

export const Route = createFileRoute("/web-performance-metrics")({
	component: WebPerformanceMetricsPage,
});

function WebPerformanceMetricsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "Browser", color: "orange" }}
				title="Web Performance Metrics"
				subtitle="Core Web Vitals measure real-world user experience. Understanding these metrics helps you identify bottlenecks, prioritize optimizations, and build faster web applications that keep users engaged."
				gradient={{ from: "orange-400", to: "amber-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Performance bottlenecks are non-obvious because they manifest as
								user frustration, not errors. A page can pass all automated
								tests and still feel slow if the{" "}
								<span className="text-orange-300 font-medium">
									Largest Contentful Paint
								</span>{" "}
								is delayed by an unoptimized hero image, or feel janky if{" "}
								<span className="text-cyan-300 font-medium">INP</span>{" "}
								(Interaction to Next Paint) spikes because a click handler
								triggers a long task. Core Web Vitals translate these perceptual
								problems into measurable thresholds that correlate with user
								retention and search ranking.
							</p>
							<p>
								Each metric targets a distinct failure mode: LCP measures
								loading, CLS measures visual stability (unexpected layout
								shifts), INP measures responsiveness, FCP measures time to first
								content, and TTFB measures server response time. Optimizing for
								one can regress another — preloading fonts improves LCP but
								increases TTFB. Understanding the interaction between metrics
								prevents whack-a-mole performance work.
							</p>
							<p className="text-zinc-400">
								The demos below cover LCP, CLS, INP, FCP, and TTFB — each with
								interactive simulations and optimization strategies.
							</p>
						</div>
					),
				}}
			/>
			<DemoSection
				title="Demo 1: LCP - Largest Contentful Paint"
				description="Measures loading performance. LCP marks when the largest visible element renders. Good: ≤2.5s, Poor: >4s. Optimize with preload, priority hints, and SSR."
			>
				<LCPDemo />
			</DemoSection>

			<DemoSection
				title="Demo 2: CLS - Cumulative Layout Shift"
				description="Measures visual stability. CLS quantifies unexpected layout shifts during page load. Good: ≤0.1, Poor: >0.25. Fix with aspect ratios and reserved space."
			>
				<CLSDemo />
			</DemoSection>

			<DemoSection
				title="Demo 3: INP - Interaction to Next Paint"
				description="Measures responsiveness. INP tracks the time from user interaction to visual feedback. Good: ≤200ms, Poor: >500ms. Optimize with debouncing and optimistic UI."
			>
				<INPDemo />
			</DemoSection>

			<DemoSection
				title="Demo 4: FCP - First Contentful Paint"
				description="Measures when first content appears. FCP marks when the browser renders the first DOM element. Good: ≤1.8s, Poor: >3s. Optimize with critical CSS and deferred JS."
			>
				<FCPDemo />
			</DemoSection>

			<DemoSection
				title="Demo 5: TTFB - Time to First Byte"
				description="Measures server response time. TTFB is the time between request and first byte received. Good: ≤800ms, Poor: >1800ms. Optimize with CDN, caching, and database indexes."
			>
				<TTFBDemo />
			</DemoSection>
		</div>
	);
}
