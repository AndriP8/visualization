export type Actor =
	| "browser"
	| "server"
	| "db"
	| "oauth-provider"
	| "resource-api";

export type AuthPhase =
	| "idle"
	| "authenticating"
	| "authenticated"
	| "refreshing"
	| "logged-out";

export interface SequenceStep {
	from: Actor;
	to: Actor;
	label: string;
	color: string;
	data?: { key: string; value: string }[];
}

export interface InspectData {
	type: "cookie" | "token" | "pkce";
	data: Record<string, unknown>;
}
