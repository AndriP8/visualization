import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BrowserStorageDemo } from "../components/browser-storage/BrowserStorageDemo";
import { CacheApiDemo } from "../components/browser-storage/CacheApiDemo";
import { CookieScopeDemo } from "../components/browser-storage/CookieScopeDemo";
import { CookieSecurityDemo } from "../components/browser-storage/CookieSecurityDemo";
import { IndexedDbFlowDemo } from "../components/browser-storage/IndexedDbFlowDemo";
import { IndexedDbSchemaDemo } from "../components/browser-storage/IndexedDbSchemaDemo";
import { LiveStorageDemo } from "../components/browser-storage/LiveStorageDemo";
import { PartitioningDemo } from "../components/browser-storage/PartitioningDemo";
import { QuotaEvictionDemo } from "../components/browser-storage/QuotaEvictionDemo";
import { StorageDecisionTreeDemo } from "../components/browser-storage/StorageDecisionTreeDemo";
import { StorageEventDemo } from "../components/browser-storage/StorageEventDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/browser-storage")({
	component: BrowserStoragePage,
});

function BrowserStoragePage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8 pb-20">
			<PageHeader
				topic={{ label: "Browser", color: "orange" }}
				title="Browser Storage"
				subtitle="Browsers give you several ways to keep data on the client, and each one has its own scope, lifetime, and access rules. Picking the wrong one is how apps end up with lost data or leaked sessions."
				gradient={{ from: "orange-400", to: "amber-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Browser storage is not one shared bucket.{" "}
								<span className="font-medium text-orange-300">Cookies</span>{" "}
								follow domain and path rules and can accompany matching HTTP
								requests. Web Storage, IndexedDB, and Cache API are generally
								scoped to an origin, and what a{" "}
								<span className="font-medium text-amber-300">
									third-party origin
								</span>{" "}
								can see is increasingly partitioned per top-level site, while
								restrictions on third-party cookies keep getting stricter.
							</p>
							<p>
								The APIs also differ in how they are accessed. localStorage and
								sessionStorage are synchronous key/value stores; IndexedDB and
								Cache API are asynchronous and support larger or more structured
								data. Lifetimes differ too: cookies can be session-scoped or
								expire at a set date, localStorage persists until explicitly
								cleared, and Cache API entries can be evicted under pressure.
								Security differs as well — an{" "}
								<span className="font-medium text-orange-300">HttpOnly</span>{" "}
								cookie is hidden from scripts, while Web Storage is readable by
								any script running on the page. Choosing an API means matching
								its scope and lifetime to the data.
							</p>
							<p className="text-zinc-400">
								Several demos below run against your browser's real storage, so
								you can write a value and watch what survives. The rest cover
								how cookies get matched to requests, how IndexedDB handles
								schema changes, what partitioning does to embedded widgets, and
								how to pick an API for a given job.
							</p>
						</div>
					),
				}}
			/>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<BrowserStorageDemo />
				<LiveStorageDemo />
				<StorageEventDemo />
				<CookieSecurityDemo />
				<CookieScopeDemo />
				<IndexedDbFlowDemo />
				<IndexedDbSchemaDemo />
				<CacheApiDemo />
				<PartitioningDemo />
				<QuotaEvictionDemo />
				<StorageDecisionTreeDemo />
			</motion.div>
		</div>
	);
}
