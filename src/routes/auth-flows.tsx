import { createFileRoute } from "@tanstack/react-router";
import { ComparisonTableDemo } from "../components/auth-flows/ComparisonTableDemo";
import { JWTAuthDemo } from "../components/auth-flows/JWTAuthDemo";
import { OAuth2PKCEDemo } from "../components/auth-flows/OAuth2PKCEDemo";
import { SessionAuthDemo } from "../components/auth-flows/SessionAuthDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/auth-flows")({
	component: AuthFlowsPage,
});

function AuthFlowsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "Web Security", color: "rose" }}
				title="Authentication Flows"
				subtitle="Session cookies, JWTs, and OAuth 2.0 all verify identity but make different trade-offs around statefulness, scalability, and delegated access. Choosing the wrong pattern introduces security holes or unnecessary operational complexity."
				gradient={{ from: "rose-400", to: "red-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Session-based auth stores identity on the server — every request
								validates a session ID against a store. It is simple and
								revocable, but requires sticky sessions or a shared session
								store for horizontal scaling.{" "}
								<span className="text-rose-300 font-medium">JWTs</span> move
								identity into a signed token the client holds — stateless and
								scalable, but tokens cannot be revoked before expiry without
								building a denylist, reintroducing server state.
							</p>
							<p>
								<span className="text-pink-300 font-medium">
									OAuth 2.0 + PKCE
								</span>{" "}
								solves delegated access — letting users grant a third party
								limited permissions without sharing their password. PKCE
								replaces the implicit flow's security weaknesses with a
								cryptographic code-challenge that prevents authorization code
								interception, now the required pattern for public clients (SPAs,
								mobile apps).
							</p>
							<p className="text-zinc-400">
								The demos below cover session-based auth, JWT with refresh token
								rotation, OAuth 2.0 + PKCE flow, and a comparison guide for
								choosing between patterns.
							</p>
						</div>
					),
				}}
			/>

			<div className="space-y-12">
				<SessionAuthDemo />
				<JWTAuthDemo />
				<OAuth2PKCEDemo />
				<ComparisonTableDemo />
			</div>
		</div>
	);
}
