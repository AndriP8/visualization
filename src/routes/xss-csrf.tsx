import { createFileRoute } from "@tanstack/react-router";
import { DemoSection } from "../components/shared/DemoSection";
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
				gradient={{ from: "rose-400", via: "red-400", to: "orange-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Both attacks hijack legitimate sessions.{" "}
								<span className="text-rose-300 font-medium">XSS</span> injects
								scripts into trusted pages — the browser executes them with full
								access to the DOM, cookies, and session storage.{" "}
								<span className="text-orange-300 font-medium">CSRF</span>{" "}
								exploits automatic cookie attachment — a hidden form or image
								tag on an attacker's site can trigger authenticated requests to
								your server without the user's knowledge.
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

			<DemoSection
				title="Reflected XSS — Payload in the Request"
				description="The attacker crafts a URL with a malicious script in a query parameter. The server reflects the unsanitized input directly into the HTML response. The script executes immediately in the victim's browser — the payload is NOT stored anywhere."
			>
				<ReflectedXSSDemo />
			</DemoSection>

			<DemoSection
				title="Stored XSS — Persistent Attack"
				description="The attacker posts a malicious payload that gets stored in the database. Every future visitor who loads the page triggers the payload — not just the attacker. A single malicious comment can compromise hundreds of sessions."
			>
				<StoredXSSDemo />
			</DemoSection>

			<DemoSection
				title="CSRF — Forged Requests from Another Origin"
				description="The victim is authenticated to bank.example.com. The attacker's page on evil.com submits a hidden form to the bank. The browser automatically attaches the session cookie — the bank cannot tell the request is forged. CSRF doesn't steal data; it forges actions."
			>
				<CSRFDemo />
			</DemoSection>

			<DemoSection
				title="Prevention Matrix — What Stops What"
				description="Not all security controls stop both attacks. Toggle each control to see which attack it blocks. Click any row for a plain-language explanation. Pay attention to the common misconceptions section."
			>
				<PreventionMatrixDemo />
			</DemoSection>
		</div>
	);
}
