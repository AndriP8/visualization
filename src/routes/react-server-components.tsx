import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { RSCHydrationDemo } from "../components/react-server-components/RSCHydrationDemo";
import { RSCPayloadDemo } from "../components/react-server-components/RSCPayloadDemo";
import { RSCvsSSRDemo } from "../components/react-server-components/RSCvsSSRDemo";
import { ServerClientBoundaryDemo } from "../components/react-server-components/ServerClientBoundaryDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/react-server-components")({
	component: ReactServerComponentsPage,
});

function ReactServerComponentsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "React", color: "violet" }}
				title="Server Components"
				subtitle="Server components render to HTML on the server and ship zero JS to the browser. Only client components hydrate — the Flight payload tells React which subtrees need handlers."
				gradient={{
					from: "violet-400",
					via: "blue-400",
					to: "cyan-400",
				}}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								React Server Components split the component tree across server
								and client environments.{" "}
								<span className="text-emerald-300 font-medium">
									Server components
								</span>{" "}
								run exclusively on the server — they ship zero client
								JavaScript, can query databases directly, and never appear in
								the browser bundle.{" "}
								<span className="text-violet-300 font-medium">
									Client components
								</span>{" "}
								run on the client (and can also be pre-rendered on the server in
								SSR mode) and handle interactivity.
							</p>
							<p>
								The most misunderstood aspect: RSC does not eliminate hydration
								— it makes it{" "}
								<span className="text-cyan-300 font-medium">selective</span>.
								When a page loads, React receives a{" "}
								<span className="text-cyan-300 font-medium">
									Flight payload
								</span>{" "}
								— not HTML, but a serialized element tree. Only the{" "}
								<span className="text-violet-300 font-medium font-mono">
									$L
								</span>{" "}
								(lazy client component) nodes in that payload trigger hydration.
								Server subtrees reconcile as plain HTML with no JS work.
							</p>
							<p className="text-zinc-400">
								The demos below cover the server/client boundary and "donut"
								pattern, the RSC Flight wire format, selective hydration
								mechanics with client state preservation, and the RSC vs SSR
								trade-off matrix.
							</p>
						</div>
					),
				}}
			/>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.3, duration: 0.4 }}
				className="space-y-16"
			>
				<ServerClientBoundaryDemo />
				<RSCPayloadDemo />
				<RSCHydrationDemo />
				<RSCvsSSRDemo />
			</motion.div>
		</div>
	);
}
