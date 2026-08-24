import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "../components/shared/PageHeader";
import { CSRFDemo } from "../components/xss-csrf/CSRFDemo";
import { PreventionMatrixDemo } from "../components/xss-csrf/PreventionMatrixDemo";
import { ReflectedXSSDemo } from "../components/xss-csrf/ReflectedXSSDemo";
import { StoredXSSDemo } from "../components/xss-csrf/StoredXSSDemo";

export const Route = createFileRoute("/xss-csrf")({
	component: XssCsrfPage,
});

function XssCsrfPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "Web Security", color: "rose" }}
				title="XSS & CSRF Attacks"
				subtitle="XSS and CSRF exploit the trust relationship between browsers, users, and servers. XSS injects code that runs as the user. CSRF tricks the browser into sending authenticated requests the user never intended."
				gradient={{ from: "rose-400", to: "red-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Both attacks hijack legitimate sessions.{" "}
								<span className="text-rose-300 font-medium">XSS</span> injects
								scripts into trusted pages — the browser executes them with full
								access to the DOM, cookies, and session storage.{" "}
								<span className="text-red-300 font-medium">CSRF</span> exploits
								automatic cookie attachment — a hidden form or image tag on an
								attacker's site can trigger authenticated requests to your
								server without the user's knowledge.
							</p>
							<p>
								These attacks are hard to catch because XSS payloads hide in
								user-generated content, URL parameters, and even SVG files. CSRF
								requires no visible interaction at all. Defenses are specific to
								each vector:{" "}
								<span className="text-rose-300 font-medium">
									CSP + output encoding
								</span>{" "}
								for XSS,{" "}
								<span className="text-orange-300 font-medium">
									SameSite cookies + CSRF tokens
								</span>{" "}
								for CSRF.
							</p>
							<p className="text-zinc-400">
								The demos below simulate reflected XSS, stored XSS, and CSRF
								attacks in a safe sandbox, then map each attack to its
								prevention strategy.
							</p>
						</div>
					),
				}}
			/>

			<div className="space-y-12">
				<ReflectedXSSDemo />
				<StoredXSSDemo />
				<CSRFDemo />
				<PreventionMatrixDemo />
			</div>
		</div>
	);
}
