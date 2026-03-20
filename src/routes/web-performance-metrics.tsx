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
		<div className="min-h-screen bg-zinc-950 text-gray-100">
			<PageHeader
				topic={{ label: "Browser", color: "blue" }}
				title="Web Performance Metrics"
				subtitle="Core Web Vitals measure real-world user experience. Understanding these metrics helps you identify bottlenecks, prioritize optimizations, and build faster web applications that keep users engaged."
				gradient={{ from: "blue-400", via: "cyan-400", to: "violet-400" }}
			/>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
				<DemoSection
					title="LCP - Largest Contentful Paint"
					description="Measures loading performance. LCP marks when the largest visible element renders. Good: ≤2.5s, Poor: >4s. Optimize with preload, priority hints, and SSR."
				>
					<LCPDemo />
				</DemoSection>

				<DemoSection
					title="CLS - Cumulative Layout Shift"
					description="Measures visual stability. CLS quantifies unexpected layout shifts during page load. Good: ≤0.1, Poor: >0.25. Fix with aspect ratios and reserved space."
				>
					<CLSDemo />
				</DemoSection>

				<DemoSection
					title="INP - Interaction to Next Paint"
					description="Measures responsiveness. INP tracks the time from user interaction to visual feedback. Good: ≤200ms, Poor: >500ms. Optimize with debouncing and optimistic UI."
				>
					<INPDemo />
				</DemoSection>

				<DemoSection
					title="FCP - First Contentful Paint"
					description="Measures when first content appears. FCP marks when the browser renders the first DOM element. Good: ≤1.8s, Poor: >3s. Optimize with critical CSS and deferred JS."
				>
					<FCPDemo />
				</DemoSection>

				<DemoSection
					title="TTFB - Time to First Byte"
					description="Measures server response time. TTFB is the time between request and first byte received. Good: ≤800ms, Poor: >1800ms. Optimize with CDN, caching, and database indexes."
				>
					<TTFBDemo />
				</DemoSection>
			</main>
		</div>
	);
}
