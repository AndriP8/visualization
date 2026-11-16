export type StorageApiId =
	| "cookie"
	| "localStorage"
	| "sessionStorage"
	| "indexedDB"
	| "cacheApi";

export type AccessMode = "sync" | "async";
export type SurvivesRestart = "yes" | "no" | "conditional";

export interface StorageApiSpec {
	id: StorageApiId;
	name: string;
	scope: string;
	access: AccessMode;
	capacity: string;
	capacityNote: string;
	survivesReload: boolean;
	survivesNewTab: boolean;
	survivesRestart: SurvivesRestart;
	scriptReadable: boolean;
	sentWithRequests: boolean;
	use: string;
}

export const STORAGE_APIS: StorageApiSpec[] = [
	{
		id: "cookie",
		name: "Cookie",
		scope: "Domain / path",
		access: "sync",
		capacity: "~4 KB each",
		capacityNote: "A single cookie is capped at about 4 KB.",
		survivesReload: true,
		survivesNewTab: true,
		survivesRestart: "conditional",
		scriptReadable: true,
		sentWithRequests: true,
		use: "Small values the server reads on matching requests",
	},
	{
		id: "localStorage",
		name: "localStorage",
		scope: "Origin",
		access: "sync",
		capacity: "~5 MB",
		capacityNote: "Roughly 5 MB of string data per origin.",
		survivesReload: true,
		survivesNewTab: true,
		survivesRestart: "yes",
		scriptReadable: true,
		sentWithRequests: false,
		use: "Small key/value preferences",
	},
	{
		id: "sessionStorage",
		name: "sessionStorage",
		scope: "Origin + tab",
		access: "sync",
		capacity: "~5 MB",
		capacityNote: "Shares the Web Storage budget with localStorage.",
		survivesReload: true,
		survivesNewTab: false,
		survivesRestart: "no",
		scriptReadable: true,
		sentWithRequests: false,
		use: "Temporary state for one tab",
	},
	{
		id: "indexedDB",
		name: "IndexedDB",
		scope: "Origin",
		access: "async",
		capacity: "Large",
		capacityNote:
			"Shares a disk-backed pool with Cache API. Much bigger than Web Storage.",
		survivesReload: true,
		survivesNewTab: true,
		survivesRestart: "yes",
		scriptReadable: true,
		sentWithRequests: false,
		use: "Structured records, files, and larger offline datasets",
	},
	{
		id: "cacheApi",
		name: "Cache API",
		scope: "Origin",
		access: "async",
		capacity: "Large",
		capacityNote: "Shares the same disk-backed pool as IndexedDB.",
		survivesReload: true,
		survivesNewTab: true,
		survivesRestart: "yes",
		scriptReadable: true,
		sentWithRequests: false,
		use: "Request and response pairs, usually used by service workers",
	},
];

export function getStorageApi(id: StorageApiId): StorageApiSpec {
	const spec = STORAGE_APIS.find((item) => item.id === id);
	if (!spec) throw new Error(`Unknown storage API: ${id}`);
	return spec;
}

export function survivesEvent(
	spec: StorageApiSpec,
	event: "reload" | "new-tab" | "restart",
): boolean | SurvivesRestart {
	switch (event) {
		case "reload":
			return spec.survivesReload;
		case "new-tab":
			return spec.survivesNewTab;
		case "restart":
			return spec.survivesRestart;
	}
}

const MULTI_PART_SUFFIXES = new Set([
	"co.uk",
	"org.uk",
	"gov.uk",
	"ac.uk",
	"co.jp",
	"com.au",
	"net.au",
	"org.au",
	"co.nz",
	"co.za",
	"com.br",
	"com.mx",
	"com.sg",
	"com.tr",
]);

export function registrableDomain(host: string): string {
	const clean = host.toLowerCase().split(":")[0];
	const labels = clean.split(".").filter(Boolean);
	if (labels.length <= 2) return labels.join(".");
	const lastTwo = labels.slice(-2).join(".");
	if (MULTI_PART_SUFFIXES.has(lastTwo) && labels.length >= 3) {
		return labels.slice(-3).join(".");
	}
	return lastTwo;
}

export type SameSiteValue = "Strict" | "Lax" | "None";

export interface CookieDefinition {
	name: string;
	domain: string;
	hostOnly: boolean;
	path: string;
	secure: boolean;
	sameSite: SameSiteValue;
	partitioned: boolean;
	partitionKey?: string;
}

export interface RequestContext {
	host: string;
	path: string;
	secure: boolean;
	topLevelSite: string;
	isTopLevelNavigation: boolean;
	method: string;
	thirdPartyCookiesAllowed: boolean;
}

export interface CookieMatchResult {
	sent: boolean;
	reason: string;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

export function domainMatches(
	cookie: CookieDefinition,
	requestHost: string,
): boolean {
	const host = requestHost.toLowerCase();
	const domain = cookie.domain.toLowerCase();
	if (host === domain) return true;
	if (cookie.hostOnly) return false;
	return host.endsWith(`.${domain}`);
}

export function pathMatches(cookiePath: string, requestPath: string): boolean {
	const cookie = cookiePath === "" ? "/" : cookiePath;
	const request = requestPath === "" ? "/" : requestPath;
	if (request === cookie) return true;
	if (!request.startsWith(cookie)) return false;
	if (cookie.endsWith("/")) return true;
	return request[cookie.length] === "/";
}

export function evaluateCookie(
	cookie: CookieDefinition,
	request: RequestContext,
): CookieMatchResult {
	if (cookie.sameSite === "None" && !cookie.secure) {
		return {
			sent: false,
			reason: "SameSite=None requires the Secure attribute",
		};
	}

	if (cookie.partitioned && cookie.sameSite !== "None") {
		return {
			sent: false,
			reason: "Partitioned cookies must also set SameSite=None",
		};
	}

	if (!domainMatches(cookie, request.host)) {
		return { sent: false, reason: "Domain does not match the request host" };
	}

	if (!pathMatches(cookie.path, request.path)) {
		return { sent: false, reason: "Path does not match the request path" };
	}

	if (cookie.secure && !request.secure) {
		return { sent: false, reason: "Secure cookie on an insecure page" };
	}

	const requestSite = registrableDomain(request.host);
	const topLevelSite = registrableDomain(request.topLevelSite);
	const isCrossSite = requestSite !== topLevelSite;

	if (isCrossSite) {
		if (cookie.sameSite === "Strict") {
			return {
				sent: false,
				reason: "SameSite=Strict blocks every cross-site request",
			};
		}
		if (
			cookie.sameSite === "Lax" &&
			!(request.isTopLevelNavigation && SAFE_METHODS.has(request.method))
		) {
			return {
				sent: false,
				reason: "SameSite=Lax blocks cross-site subrequests",
			};
		}
	}

	if (cookie.partitioned) {
		const partition = cookie.partitionKey
			? registrableDomain(cookie.partitionKey)
			: undefined;
		if (isCrossSite && partition !== topLevelSite) {
			return {
				sent: false,
				reason: "Partitioned cookie belongs to a different top-level site",
			};
		}
		return { sent: true, reason: "Sent — stored in this site's partition" };
	}

	if (isCrossSite && !request.thirdPartyCookiesAllowed) {
		return {
			sent: false,
			reason: "Third-party cookie blocked by browser policy",
		};
	}

	return { sent: true, reason: "Sent with the request" };
}

export function describeCookie(cookie: CookieDefinition): string {
	const parts = [
		`${cookie.name}=…`,
		cookie.hostOnly ? "host-only" : `Domain=${cookie.domain}`,
		`Path=${cookie.path}`,
	];
	if (cookie.secure) parts.push("Secure");
	if (cookie.partitioned) parts.push("Partitioned");
	parts.push(`SameSite=${cookie.sameSite}`);
	return parts.join("; ");
}

export type PartitionMode =
	| "first-party"
	| "third-party"
	| "chips"
	| "unrelated";

export interface PartitionScenario {
	id: PartitionMode;
	label: string;
	topLevelSite: string;
	embedder: string;
	embeds: string;
	summary: string;
	result: string;
	outcome: "sent" | "blocked" | "isolated";
}

export const PARTITION_SCENARIOS: PartitionScenario[] = [
	{
		id: "first-party",
		label: "First-party visit",
		topLevelSite: "shop.example",
		embedder: "shop.example",
		embeds: "shop.example",
		summary:
			"The user opens the site directly, so the site is the top-level page.",
		result: "Cookie is stored in the first-party jar and sent normally.",
		outcome: "sent",
	},
	{
		id: "third-party",
		label: "Embedded in another site",
		topLevelSite: "news.example",
		embedder: "news.example",
		embeds: "shop.example",
		summary:
			"A different site embeds the widget, so the widget runs in a third-party context.",
		result:
			"An unpartitioned cookie is not sent here. Browsers either block it outright or apply the user's third-party cookie setting.",
		outcome: "blocked",
	},
	{
		id: "chips",
		label: "Embedded with Partitioned",
		topLevelSite: "news.example",
		embedder: "news.example",
		embeds: "shop.example",
		summary:
			"The cookie was set with the Partitioned attribute, so it lives in its own jar keyed by the top-level site.",
		result:
			"The cookie is sent, but only while the user is on news.example. The news site cannot read a cookie stored under a different top-level site.",
		outcome: "isolated",
	},
	{
		id: "unrelated",
		label: "A different embedder",
		topLevelSite: "blog.example",
		embedder: "blog.example",
		embeds: "shop.example",
		summary:
			"The same widget is embedded on a site that was never seen before.",
		result:
			"The partitioned jar for blog.example is empty, so no cookie is sent. Each top-level site gets a separate jar.",
		outcome: "blocked",
	},
];

export type StorageAnswer = "yes" | "no";

export interface StorageQuestion {
	id: string;
	text: string;
	yesNext: string | "result";
	noNext: string | "result";
	yesResult?: StorageApiId;
	noResult?: StorageApiId;
}

export interface StorageRecommendation {
	api: StorageApiId;
	icon: string;
	color: string;
	headline: string;
	description: string;
	useCases: string[];
	code: string;
}

export const STORAGE_QUESTIONS: Record<string, StorageQuestion> = {
	start: {
		id: "start",
		text: "Are you caching network responses to serve the app offline?",
		yesNext: "result",
		noNext: "server",
		yesResult: "cacheApi",
		noResult: undefined,
	},
	server: {
		id: "server",
		text: "Does the server need to read this value automatically on every request?",
		yesNext: "result",
		noNext: "size",
		yesResult: "cookie",
		noResult: undefined,
	},
	size: {
		id: "size",
		text: "Is the data structured, or larger than a few kilobytes?",
		yesNext: "result",
		noNext: "lifetime",
		yesResult: "indexedDB",
		noResult: undefined,
	},
	lifetime: {
		id: "lifetime",
		text: "Does the value need to survive when the tab is closed?",
		yesNext: "result",
		noNext: "result",
		yesResult: "localStorage",
		noResult: "sessionStorage",
	},
};

export const STORAGE_RECOMMENDATIONS: Record<
	StorageApiId,
	StorageRecommendation
> = {
	cookie: {
		api: "cookie",
		icon: "🍪",
		color: "amber",
		headline: "Cookie",
		description:
			"The only storage the server reads on its own. It travels with matching requests.",
		useCases: [
			"Session identifiers",
			"Remember-me tokens",
			"Server-side A/B flags",
			"Anything the backend must see",
		],
		code: `document.cookie = "session=abc123; Path=/; HttpOnly; Secure; SameSite=Lax";`,
	},
	localStorage: {
		api: "localStorage",
		icon: "💾",
		color: "orange",
		headline: "localStorage",
		description:
			"Small key/value data that outlives the tab and is readable by any script on the page.",
		useCases: [
			"UI preferences and themes",
			"Draft text you want to keep",
			"Feature flags read at startup",
			"Remembered table page size",
		],
		code: `localStorage.setItem("theme", "dark");
localStorage.getItem("theme");`,
	},
	sessionStorage: {
		api: "sessionStorage",
		icon: "🕒",
		color: "cyan",
		headline: "sessionStorage",
		description:
			"Like localStorage, but it is discarded when the tab closes. Each tab gets its own copy.",
		useCases: [
			"One-off wizard state",
			"Temporary form values",
			"Per-tab layout choices",
			"Redirect payloads",
		],
		code: `sessionStorage.setItem("wizardStep", "2");
sessionStorage.getItem("wizardStep");`,
	},
	indexedDB: {
		api: "indexedDB",
		icon: "🗄️",
		color: "sky",
		headline: "IndexedDB",
		description:
			"Structured records stored asynchronously. It handles objects, blobs, and large datasets.",
		useCases: [
			"Offline documents and drafts",
			"Queued writes and sync",
			"Blobs such as images",
			"Data large enough to stall localStorage",
		],
		code: `const request = indexedDB.open("app-db", 1);
request.onsuccess = () => {
  const db = request.result;
  const tx = db.transaction("notes", "readwrite");
  tx.objectStore("notes").put({ id: 1, body: "hello" });
};`,
	},
	cacheApi: {
		api: "cacheApi",
		icon: "📦",
		color: "emerald",
		headline: "Cache API",
		description:
			"Stores whole responses keyed by request URL. Service workers read from it on fetch events.",
		useCases: [
			"App shell for offline use",
			"Precaching static assets",
			"Serving stale content while revalidating",
			"Replayable API responses",
		],
		code: `const cache = await caches.open("app-shell-v1");
await cache.put("/index.html", await fetch("/index.html"));
const hit = await cache.match("/index.html");`,
	},
};
