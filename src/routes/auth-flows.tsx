import { createFileRoute } from "@tanstack/react-router";
import { ComparisonTableDemo } from "../components/auth-flows/ComparisonTableDemo";
import { JWTAuthDemo } from "../components/auth-flows/JWTAuthDemo";
import { OAuth2PKCEDemo } from "../components/auth-flows/OAuth2PKCEDemo";
import { SessionAuthDemo } from "../components/auth-flows/SessionAuthDemo";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/auth-flows")({
	component: AuthFlowsPage,
});

function AuthFlowsPage() {
	return (
		<div className="max-w-7xl mx-auto space-y-12">
			<PageHeader
				topic={{ label: "Web Security", color: "orange" }}
				title="Authentication Flows"
				subtitle="How modern web apps verify identity - from sessions to OAuth 2.0"
				gradient={{ from: "red-400", via: "rose-400", to: "pink-400" }}
			/>

			<DemoSection
				title="Session-Based Authentication"
				description="Traditional cookie-based auth with server-side session storage"
			>
				<SessionAuthDemo />
			</DemoSection>

			<DemoSection
				title="JSON Web Tokens (JWT)"
				description="Stateless authentication with signed tokens and refresh token rotation"
			>
				<JWTAuthDemo />
			</DemoSection>

			<DemoSection
				title="OAuth 2.0 + PKCE"
				description="Delegated authentication with third-party providers (industry standard for web, mobile, and desktop apps)"
			>
				<OAuth2PKCEDemo />
			</DemoSection>

			<DemoSection
				title="Comparison & Decision Guide"
				description="When to use each authentication pattern"
			>
				<ComparisonTableDemo />
			</DemoSection>
		</div>
	);
}
