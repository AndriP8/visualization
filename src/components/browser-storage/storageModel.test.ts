import { describe, expect, it } from "vitest";
import {
	type CookieDefinition,
	evaluateCookie,
	pathMatches,
	type RequestContext,
	registrableDomain,
} from "./storageModel";

const baseRequest: RequestContext = {
	host: "shop.example.com",
	path: "/checkout/cart",
	secure: true,
	topLevelSite: "shop.example.com",
	isTopLevelNavigation: false,
	method: "GET",
	thirdPartyCookiesAllowed: true,
};

function cookie(overrides: Partial<CookieDefinition> = {}): CookieDefinition {
	return {
		name: "sid",
		domain: "shop.example.com",
		hostOnly: true,
		path: "/",
		secure: true,
		sameSite: "Lax",
		partitioned: false,
		...overrides,
	};
}

describe("registrableDomain", () => {
	it("keeps a plain domain", () => {
		expect(registrableDomain("shop.example.com")).toBe("example.com");
	});

	it("handles multi-part public suffixes", () => {
		expect(registrableDomain("shop.example.co.uk")).toBe("example.co.uk");
	});

	it("ignores the port", () => {
		expect(registrableDomain("example.com:3000")).toBe("example.com");
	});
});

describe("pathMatches", () => {
	it("matches an exact path", () => {
		expect(pathMatches("/checkout", "/checkout")).toBe(true);
	});

	it("matches a deeper path below the cookie path", () => {
		expect(pathMatches("/checkout", "/checkout/cart")).toBe(true);
	});

	it("does not match a path that only shares a prefix", () => {
		expect(pathMatches("/checkout", "/checkout-old")).toBe(false);
	});

	it("matches everything when the cookie path is the root", () => {
		expect(pathMatches("/", "/anything")).toBe(true);
	});
});

describe("evaluateCookie", () => {
	it("sends a matching first-party cookie", () => {
		expect(evaluateCookie(cookie(), baseRequest).sent).toBe(true);
	});

	it("sends a domain cookie to a subdomain", () => {
		const result = evaluateCookie(
			cookie({ domain: "example.com", hostOnly: false }),
			baseRequest,
		);
		expect(result.sent).toBe(true);
	});

	it("withholds a host-only cookie from a subdomain", () => {
		const result = evaluateCookie(
			cookie({ domain: "example.com", hostOnly: true }),
			baseRequest,
		);
		expect(result.sent).toBe(false);
		expect(result.reason).toContain("Domain");
	});

	it("withholds a cookie whose path does not match", () => {
		const result = evaluateCookie(cookie({ path: "/admin" }), baseRequest);
		expect(result.sent).toBe(false);
		expect(result.reason).toContain("Path");
	});

	it("withholds a Secure cookie on an insecure page", () => {
		const result = evaluateCookie(cookie(), { ...baseRequest, secure: false });
		expect(result.sent).toBe(false);
		expect(result.reason).toContain("Secure");
	});

	it("rejects SameSite=None without Secure", () => {
		const result = evaluateCookie(
			cookie({ sameSite: "None", secure: false }),
			baseRequest,
		);
		expect(result.sent).toBe(false);
		expect(result.reason).toContain("SameSite=None");
	});

	it("blocks every cross-site request for SameSite=Strict", () => {
		const result = evaluateCookie(
			cookie({ domain: "shop.example.com", sameSite: "Strict" }),
			{
				...baseRequest,
				topLevelSite: "news.example",
				isTopLevelNavigation: true,
				method: "GET",
			},
		);
		expect(result.sent).toBe(false);
		expect(result.reason).toContain("Strict");
	});

	it("allows a top-level GET navigation for SameSite=Lax", () => {
		const result = evaluateCookie(cookie({ domain: "shop.example.com" }), {
			...baseRequest,
			topLevelSite: "news.example",
			isTopLevelNavigation: true,
			method: "GET",
		});
		expect(result.sent).toBe(true);
	});

	it("blocks a cross-site subrequest for SameSite=Lax", () => {
		const result = evaluateCookie(cookie({ domain: "shop.example.com" }), {
			...baseRequest,
			topLevelSite: "news.example",
			isTopLevelNavigation: false,
			method: "GET",
		});
		expect(result.sent).toBe(false);
		expect(result.reason).toContain("Lax");
	});

	it("blocks a third-party cookie when policy forbids it", () => {
		const result = evaluateCookie(
			cookie({ domain: "shop.example.com", sameSite: "None" }),
			{
				...baseRequest,
				topLevelSite: "news.example",
				thirdPartyCookiesAllowed: false,
			},
		);
		expect(result.sent).toBe(false);
		expect(result.reason).toContain("Third-party");
	});

	it("sends a partitioned cookie inside its own partition", () => {
		const result = evaluateCookie(
			cookie({
				domain: "shop.example.com",
				partitioned: true,
				partitionKey: "news.example",
				sameSite: "None",
			}),
			{
				...baseRequest,
				topLevelSite: "news.example",
			},
		);
		expect(result.sent).toBe(true);
	});

	it("withholds a partitioned cookie in a different partition", () => {
		const result = evaluateCookie(
			cookie({
				domain: "shop.example.com",
				partitioned: true,
				partitionKey: "news.example",
				sameSite: "None",
			}),
			{
				...baseRequest,
				topLevelSite: "blog.example",
			},
		);
		expect(result.sent).toBe(false);
		expect(result.reason).toContain("Partitioned");
	});

	it("requires SameSite=None on a partitioned cookie", () => {
		const result = evaluateCookie(
			cookie({
				domain: "shop.example.com",
				partitioned: true,
				partitionKey: "news.example",
				sameSite: "Lax",
			}),
			{
				...baseRequest,
				topLevelSite: "news.example",
			},
		);
		expect(result.sent).toBe(false);
		expect(result.reason).toContain("SameSite=None");
	});
});
