import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BackgroundSyncDemo } from "../components/service-workers/BackgroundSyncDemo";
import { MessagingDemo } from "../components/service-workers/MessagingDemo";
import { OfflineFallbackDemo } from "../components/service-workers/OfflineFallbackDemo";
import { ServiceWorkerDemo } from "../components/service-workers/ServiceWorkerDemo";
import { WorkerUpdateDemo } from "../components/service-workers/WorkerUpdateDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/service-workers")({
	component: ServiceWorkersPage,
});

function ServiceWorkersPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8 pb-20">
			<PageHeader
				topic={{ label: "Browser", color: "orange" }}
				title="Service Workers & Offline Support"
				subtitle="A service worker can intercept page requests, serve cached responses, and keep key parts of an app available when the network is unreliable."
				gradient={{ from: "orange-400", to: "amber-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								A service worker is a script the browser runs separately from a
								page, registered from JavaScript and only on secure (HTTPS)
								origins. It has no direct DOM access; instead, it listens for
								lifecycle and fetch events and can communicate with pages in its
								scope.
							</p>
							<p>
								The lifecycle moves through{" "}
								<span className="font-medium text-orange-300">install</span>,{" "}
								<span className="font-medium text-amber-300">activate</span>,
								and fetch handling. During installation an app can cache its
								shell. During activation it can delete cache versions that are
								no longer current, which is the only thing that stops old assets
								from piling up. Fetch handlers decide whether a response comes
								from the network or Cache Storage.
							</p>
							<p>
								Three limits shape everything else. The worker is killed when
								idle, so state that must survive — a request queue, for example
								— belongs in IndexedDB rather than in a module variable. It only
								controls pages inside its{" "}
								<span className="font-medium text-amber-300">scope</span>, and a
								page loaded before activation is uncontrolled until the worker
								claims it. And it cannot touch the DOM, so pages and worker
								coordinate by messaging: a page posts to its controller, and the
								worker replies to one client or broadcasts to all of them.
							</p>
							<p className="text-zinc-400">
								Explore lifecycle and cache strategies, page ↔ worker messaging,
								updates that wait for open clients, a background-sync queue that
								replays when the network returns, and a cached navigation
								fallback for offline page loads.
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
				<ServiceWorkerDemo />
				<MessagingDemo />
				<WorkerUpdateDemo />
				<BackgroundSyncDemo />
				<OfflineFallbackDemo />
			</motion.div>
		</div>
	);
}
