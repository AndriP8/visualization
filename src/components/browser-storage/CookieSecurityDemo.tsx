import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

type SameSite = "Strict" | "Lax" | "None";

export function CookieSecurityDemo() {
	const [httpOnly, setHttpOnly] = useState(true);
	const [secure, setSecure] = useState(true);
	const [sameSite, setSameSite] = useState<SameSite>("Lax");
	const [https, setHttps] = useState(true);
	const canSetNone = sameSite !== "None" || secure;
	const crossSiteSubrequest = sameSite === "None" && secure && https;
	const topLevelGet =
		sameSite !== "Strict" && (sameSite !== "None" || (secure && https));

	return (
		<DemoSection
			title="Demo 4: Cookie security attributes"
			description="Cookie attributes control whether JavaScript can read a cookie and when the browser sends it with requests."
		>
			<div className="space-y-5">
				<div className="grid gap-5 md:grid-cols-2">
					<div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
							<span>HttpOnly</span>
							<input
								type="checkbox"
								checked={httpOnly}
								onChange={(event) => setHttpOnly(event.target.checked)}
								className="accent-orange-400"
							/>
						</label>
						<label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
							<span>Secure</span>
							<input
								type="checkbox"
								checked={secure}
								onChange={(event) => setSecure(event.target.checked)}
								className="accent-orange-400"
							/>
						</label>
						<label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
							<span>HTTPS page</span>
							<input
								type="checkbox"
								checked={https}
								onChange={(event) => setHttps(event.target.checked)}
								className="accent-orange-400"
							/>
						</label>
						<div className="border-t border-zinc-800 pt-3">
							<div className="mb-2 text-xs text-zinc-500">SameSite</div>
							<div className="flex gap-2">
								{(["Strict", "Lax", "None"] as const).map((value) => (
									<button
										key={value}
										type="button"
										onClick={() => setSameSite(value)}
										className={`flex-1 rounded-md border py-2 text-xs ${sameSite === value ? "border-orange-500/40 bg-orange-500/10 text-orange-300" : "border-zinc-800 text-zinc-500"}`}
									>
										{value}
									</button>
								))}
							</div>
						</div>
					</div>
					<div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<div className="text-xs uppercase tracking-wider text-zinc-500">
							Browser behavior
						</div>
						<div className="flex justify-between gap-3 text-sm">
							<span className="text-zinc-400">Readable by document.cookie</span>
							<strong
								className={httpOnly ? "text-rose-300" : "text-emerald-300"}
							>
								{httpOnly ? "No · HttpOnly" : "Yes"}
							</strong>
						</div>
						<div className="flex justify-between gap-3 text-sm">
							<span className="text-zinc-400">Cross-site subrequest</span>
							<strong
								className={
									crossSiteSubrequest ? "text-emerald-300" : "text-rose-300"
								}
							>
								{crossSiteSubrequest ? "Sent" : "Withheld"}
							</strong>
						</div>
						<div className="flex justify-between gap-3 text-sm">
							<span className="text-zinc-400">Cross-site top-level GET</span>
							<strong
								className={topLevelGet ? "text-emerald-300" : "text-rose-300"}
							>
								{topLevelGet ? "Sent" : "Withheld"}
							</strong>
						</div>
						<div className="flex justify-between gap-3 text-sm">
							<span className="text-zinc-400">
								Secure cookie over this page
							</span>
							<strong
								className={
									secure && !https ? "text-rose-300" : "text-emerald-300"
								}
							>
								{secure && !https ? "Not sent over HTTP" : "Allowed"}
							</strong>
						</div>
					</div>
				</div>
				{!canSetNone && (
					<p className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">
						SameSite=None cookies must also use Secure in modern browsers.
					</p>
				)}
				<p className="text-xs text-zinc-500">
					Simplified request model: SameSite=Lax permits top-level safe
					navigations but blocks most cross-site subrequests. Actual cookie
					delivery also depends on domain, path, expiry, and browser policy —
					see the next demo for how those rules are applied. Access in
					third-party contexts increasingly requires the Partitioned (CHIPS)
					attribute as browsers restrict third-party cookies.
				</p>
			</div>
		</DemoSection>
	);
}
