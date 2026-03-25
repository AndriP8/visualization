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
				subtitle="How cross-site scripting and forged requests exploit browser trust — and how to stop them."
				gradient={{ from: "rose-400", via: "red-400", to: "orange-400" }}
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
