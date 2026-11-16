import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";
import {
	type CookieDefinition,
	describeCookie,
	evaluateCookie,
	type RequestContext,
} from "./storageModel";

const COOKIE_PRESETS: CookieDefinition[] = [
	{
		name: "sid",
		domain: "shop.example.com",
		hostOnly: true,
		path: "/",
		secure: true,
		sameSite: "Lax",
		partitioned: false,
	},
	{
		name: "theme",
		domain: "example.com",
		hostOnly: false,
		path: "/",
		secure: false,
		sameSite: "Lax",
		partitioned: false,
	},
	{
		name: "admin",
		domain: "shop.example.com",
		hostOnly: true,
		path: "/admin",
		secure: true,
		sameSite: "Strict",
		partitioned: false,
	},
	{
		name: "__Host-session",
		domain: "shop.example.com",
		hostOnly: true,
		path: "/",
		secure: true,
		sameSite: "Strict",
		partitioned: false,
	},
	{
		name: "__Secure-token",
		domain: "shop.example.com",
		hostOnly: true,
		path: "/",
		secure: true,
		sameSite: "None",
		partitioned: true,
		partitionKey: "news.example",
	},
];

interface RequestPreset {
	id: string;
	label: string;
	request: RequestContext;
}

const REQUEST_PRESETS: RequestPreset[] = [
	{
		id: "first-party",
		label: "First-party page load",
		request: {
			host: "shop.example.com",
			path: "/products/42",
			secure: true,
			topLevelSite: "shop.example.com",
			isTopLevelNavigation: true,
			method: "GET",
			thirdPartyCookiesAllowed: true,
		},
	},
	{
		id: "subdomain",
		label: "Subdomain request",
		request: {
			host: "cdn.shop.example.com",
			path: "/products/42",
			secure: true,
			topLevelSite: "shop.example.com",
			isTopLevelNavigation: false,
			method: "GET",
			thirdPartyCookiesAllowed: true,
		},
	},
	{
		id: "admin",
		label: "Admin path",
		request: {
			host: "shop.example.com",
			path: "/admin/settings",
			secure: true,
			topLevelSite: "shop.example.com",
			isTopLevelNavigation: true,
			method: "GET",
			thirdPartyCookiesAllowed: true,
		},
	},
	{
		id: "third-party",
		label: "Embedded on another site",
		request: {
			host: "shop.example.com",
			path: "/widget",
			secure: true,
			topLevelSite: "news.example",
			isTopLevelNavigation: false,
			method: "GET",
			thirdPartyCookiesAllowed: false,
		},
	},
];

interface LifetimeOption {
	id: string;
	label: string;
	maxAge: number | null;
	attribute: string;
}

const LIFETIMES: LifetimeOption[] = [
	{
		id: "session",
		label: "Session cookie",
		maxAge: null,
		attribute: "(no Max-Age)",
	},
	{
		id: "hour",
		label: "1 hour",
		maxAge: 3600,
		attribute: "Max-Age=3600",
	},
	{
		id: "day",
		label: "1 day",
		maxAge: 86400,
		attribute: "Max-Age=86400",
	},
	{
		id: "month",
		label: "30 days",
		maxAge: 2592000,
		attribute: "Max-Age=2592000",
	},
];

export function CookieScopeDemo() {
	const [presetIndex, setPresetIndex] = useState(0);
	const [lifetimeIndex, setLifetimeIndex] = useState(0);
	const preset = REQUEST_PRESETS[presetIndex];
	const lifetime = LIFETIMES[lifetimeIndex];

	const lifetimeLabel = match(lifetime.maxAge)
		.with(null, () => "until the browser closes")
		.with(3600, () => "for 1 hour")
		.with(86400, () => "for 1 day")
		.with(2592000, () => "for 30 days")
		.otherwise(() => "for a fixed time");

	const results = useMemo(
		() =>
			COOKIE_PRESETS.map((cookie) => ({
				cookie,
				result: evaluateCookie(cookie, preset.request),
			})),
		[preset],
	);

	return (
		<DemoSection
			title="Demo 5: Cookie scope and lifetime"
			description="A cookie is only sent when its domain, path, secure flag, and site rules all match. Change the kind of request and see which cookies the browser would actually attach."
		>
			<div className="space-y-5">
				<div>
					<div className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
						Incoming request
					</div>
					<div className="flex flex-wrap gap-2">
						{REQUEST_PRESETS.map((item, index) => (
							<button
								key={item.id}
								type="button"
								onClick={() => setPresetIndex(index)}
								className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
									index === presetIndex
										? "border-orange-500/40 bg-orange-500/10 text-orange-300"
										: "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
								}`}
							>
								{item.label}
							</button>
						))}
					</div>
					<div className="mt-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 font-mono text-[11px] text-zinc-400">
						{preset.request.method} {preset.request.host}
						{preset.request.path} · top level: {preset.request.topLevelSite}
						{preset.request.secure ? " · HTTPS" : " · HTTP"}
					</div>
				</div>

				<div>
					<div className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
						Cookie lifetime
					</div>
					<div className="flex flex-wrap gap-2">
						{LIFETIMES.map((item, index) => (
							<button
								key={item.id}
								type="button"
								onClick={() => setLifetimeIndex(index)}
								className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
									index === lifetimeIndex
										? "border-amber-500/40 bg-amber-500/10 text-amber-300"
										: "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
								}`}
							>
								{item.label}
							</button>
						))}
					</div>
					<p className="mt-2 text-[11px] text-zinc-500">
						<span className="font-mono text-zinc-400">
							{lifetime.attribute}
						</span>{" "}
						— the cookie lives {lifetimeLabel}. Lifetime never affects whether a
						cookie is sent; it only affects how long the browser keeps it.
					</p>
				</div>

				<div className="space-y-2">
					{results.map(({ cookie, result }) => (
						<motion.div
							key={cookie.name}
							layout
							className={`rounded-lg border p-3 ${
								result.sent
									? "border-emerald-500/25 bg-emerald-500/5"
									: "border-zinc-800 bg-zinc-950/50"
							}`}
						>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<code className="font-mono text-xs text-zinc-200">
									{describeCookie(cookie)}
								</code>
								<span
									className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
										result.sent
											? "bg-emerald-500/15 text-emerald-300"
											: "bg-zinc-800 text-zinc-500"
									}`}
								>
									{result.sent ? "Sent" : "Withheld"}
								</span>
							</div>
							<p className="mt-1 text-[11px] text-zinc-500">{result.reason}</p>
						</motion.div>
					))}
				</div>

				<div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 text-xs leading-relaxed text-zinc-400">
					<strong className="text-orange-300">Host-only vs Domain:</strong> a
					host-only cookie (the default when you omit{" "}
					<code className="font-mono text-zinc-200">Domain</code>) goes only to
					the exact host that set it. Adding{" "}
					<code className="font-mono text-zinc-200">Domain=example.com</code>{" "}
					widens it to every subdomain of that domain, which also means every
					subdomain can read it.
				</div>

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`// Host-only, sent only to this exact host
document.cookie = "sid=abc; Path=/; Secure; SameSite=Lax";

// Shared with every subdomain — and readable by them
document.cookie = "theme=dark; Domain=example.com; Path=/";

// Prefix rules the browser enforces
// __Host-  -> Secure + Path=/ + no Domain attribute
// __Secure- -> Secure, Domain is allowed`}
				/>

				<div className="space-y-2 text-xs leading-relaxed text-zinc-500">
					<p>
						<strong className="text-zinc-300">Lifetime.</strong> A cookie with
						no expiry is a session cookie: it disappears when the browser
						closes.{" "}
						<code className="font-mono text-zinc-300">Max-Age=3600</code> counts
						seconds from the moment it was set, while{" "}
						<code className="font-mono text-zinc-300">Expires</code> is an
						absolute date. A single cookie holds about 4 KB, and most browsers
						limit an origin to a few hundred cookies.
					</p>
					<p>
						<strong className="text-zinc-300">Prefixes.</strong> The{" "}
						<code className="font-mono text-zinc-300">__Host-</code> and{" "}
						<code className="font-mono text-zinc-300">__Secure-</code> prefixes
						are rejected by the browser unless the required attributes are set.
						They remove the chance of a subdomain quietly overwriting a cookie
						set by the parent domain.
					</p>
				</div>
			</div>
		</DemoSection>
	);
}
