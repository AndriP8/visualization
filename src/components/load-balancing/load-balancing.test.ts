import { describe, expect, it } from "vitest";
import {
	buildWeightedSequence,
	getLeastConnected,
	getNextRoundRobin,
	getNextWeightedRoundRobin,
} from "./load-balancing";

describe("getNextRoundRobin", () => {
	const servers = [
		{ id: 1, healthy: true },
		{ id: 2, healthy: true },
		{ id: 3, healthy: true },
		{ id: 4, healthy: true },
	];

	it("returns first server when starting at index 0", () => {
		const result = getNextRoundRobin(servers, 0);
		expect(result).toEqual({ serverIndex: 0, nextIndex: 1 });
	});

	it("cycles through servers sequentially", () => {
		const assignments: number[] = [];
		let index = 0;

		for (let i = 0; i < 10; i++) {
			const result = getNextRoundRobin(servers, index);
			expect(result).not.toBeNull();
			if (!result) return;
			assignments.push(result.serverIndex);
			index = result.nextIndex;
		}

		expect(assignments).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0, 1]);
	});

	it("distributes evenly across all servers", () => {
		const counts = [0, 0, 0, 0];
		let index = 0;

		for (let i = 0; i < 20; i++) {
			const result = getNextRoundRobin(servers, index);
			expect(result).not.toBeNull();
			if (!result) return;
			counts[result.serverIndex]++;
			index = result.nextIndex;
		}

		expect(counts).toEqual([5, 5, 5, 5]);
	});

	it("skips unhealthy servers", () => {
		const serversWithUnhealthy = [
			{ id: 1, healthy: true },
			{ id: 2, healthy: false },
			{ id: 3, healthy: true },
			{ id: 4, healthy: true },
		];

		const assignments: number[] = [];
		let index = 0;

		for (let i = 0; i < 9; i++) {
			const result = getNextRoundRobin(serversWithUnhealthy, index);
			expect(result).not.toBeNull();
			if (!result) return;
			assignments.push(result.serverIndex);
			index = result.nextIndex;
		}

		expect(assignments).not.toContain(1);
		const counts = [0, 0, 0, 0];
		for (const a of assignments) counts[a]++;
		expect(counts).toEqual([3, 0, 3, 3]);
	});

	it("returns null when all servers are unhealthy", () => {
		const allUnhealthy = [
			{ id: 1, healthy: false },
			{ id: 2, healthy: false },
		];
		expect(getNextRoundRobin(allUnhealthy, 0)).toBeNull();
	});

	it("returns null for empty server list", () => {
		expect(getNextRoundRobin([], 0)).toBeNull();
	});

	it("wraps around when currentIndex exceeds length", () => {
		const result = getNextRoundRobin(servers, 10);
		expect(result).toEqual({ serverIndex: 2, nextIndex: 3 });
	});

	it("continues from where previous batch left off (simulates re-click)", () => {
		const firstBatch: number[] = [];
		let index = 0;
		for (let i = 0; i < 10; i++) {
			const result = getNextRoundRobin(servers, index);
			expect(result).not.toBeNull();
			if (!result) return;
			firstBatch.push(result.serverIndex);
			index = result.nextIndex;
		}

		const secondBatch: number[] = [];
		for (let i = 0; i < 10; i++) {
			const result = getNextRoundRobin(servers, index);
			expect(result).not.toBeNull();
			if (!result) return;
			secondBatch.push(result.serverIndex);
			index = result.nextIndex;
		}

		const counts = [0, 0, 0, 0];
		for (const a of [...firstBatch, ...secondBatch]) counts[a]++;
		expect(counts).toEqual([5, 5, 5, 5]);
	});
});

describe("getLeastConnected", () => {
	it("returns the server with fewest active connections", () => {
		const servers = [
			{ id: 1, activeConnections: 5 },
			{ id: 2, activeConnections: 2 },
			{ id: 3, activeConnections: 8 },
			{ id: 4, activeConnections: 3 },
		];
		expect(getLeastConnected(servers)).toEqual({
			id: 2,
			activeConnections: 2,
		});
	});

	it("returns first server when all have equal connections (stable)", () => {
		const servers = [
			{ id: 1, activeConnections: 3 },
			{ id: 2, activeConnections: 3 },
			{ id: 3, activeConnections: 3 },
		];
		expect(getLeastConnected(servers)?.id).toBe(1);
	});

	it("returns null for empty server list", () => {
		expect(getLeastConnected([])).toBeNull();
	});

	it("distributes 10 requests across 4 idle servers", () => {
		const servers = [
			{ id: 1, activeConnections: 0 },
			{ id: 2, activeConnections: 0 },
			{ id: 3, activeConnections: 0 },
			{ id: 4, activeConnections: 0 },
		];

		for (let i = 0; i < 10; i++) {
			const target = getLeastConnected(servers);
			expect(target).not.toBeNull();
			if (!target) return;
			target.activeConnections++;
		}

		expect(servers.map((s) => s.activeConnections)).toEqual([3, 3, 2, 2]);
	});

	it("routes to idle servers when one server is overloaded", () => {
		const servers = [
			{ id: 1, activeConnections: 10 },
			{ id: 2, activeConnections: 0 },
			{ id: 3, activeConnections: 0 },
			{ id: 4, activeConnections: 0 },
		];

		for (let i = 0; i < 10; i++) {
			const target = getLeastConnected(servers);
			expect(target).not.toBeNull();
			if (!target) return;
			target.activeConnections++;
		}

		expect(servers[0].activeConnections).toBe(10);
		expect(servers[1].activeConnections).toBeGreaterThanOrEqual(3);
		expect(servers[2].activeConnections).toBeGreaterThanOrEqual(3);
		expect(servers[3].activeConnections).toBeGreaterThanOrEqual(3);
		const total = servers.reduce((s, srv) => s + srv.activeConnections, 0);
		expect(total).toBe(20);
	});

	it("simulates re-click: server 1 has 10, send 10 more", () => {
		const servers = [
			{ id: 1, activeConnections: 10 },
			{ id: 2, activeConnections: 0 },
			{ id: 3, activeConnections: 0 },
			{ id: 4, activeConnections: 0 },
		];

		const assignments: number[] = [];
		for (let i = 0; i < 10; i++) {
			const target = getLeastConnected(servers);
			expect(target).not.toBeNull();
			if (!target) return;
			assignments.push(target.id);
			target.activeConnections++;
		}

		expect(assignments).not.toContain(1);
		expect(servers[1].activeConnections).toBeGreaterThanOrEqual(3);
		expect(servers[2].activeConnections).toBeGreaterThanOrEqual(3);
		expect(servers[3].activeConnections).toBeGreaterThanOrEqual(3);
	});

	it("simulates re-click mid-flight: partial completion", () => {
		const servers = [
			{ id: 1, activeConnections: 2 },
			{ id: 2, activeConnections: 3 },
			{ id: 3, activeConnections: 1 },
			{ id: 4, activeConnections: 4 },
		];

		const assignments: number[] = [];
		for (let i = 0; i < 8; i++) {
			const target = getLeastConnected(servers);
			expect(target).not.toBeNull();
			if (!target) return;
			assignments.push(target.id);
			target.activeConnections++;
		}

		expect(assignments[0]).toBe(3);
		expect(assignments[1]).toBe(1);

		const max = Math.max(...servers.map((s) => s.activeConnections));
		const min = Math.min(...servers.map((s) => s.activeConnections));
		expect(max - min).toBeLessThanOrEqual(1);
	});

	it("treats missing activeConnections as 0", () => {
		const servers = [
			{ id: 1, activeConnections: 5 },
			{ id: 2 },
			{ id: 3, activeConnections: 3 },
		];
		expect(getLeastConnected(servers)?.id).toBe(2);
	});
});

describe("buildWeightedSequence", () => {
	it("builds sequence based on weights", () => {
		const servers = [
			{ id: 1, weight: 1 },
			{ id: 2, weight: 2 },
			{ id: 3, weight: 3 },
		];
		const sequence = buildWeightedSequence(servers);
		expect(sequence.map((s) => s.id)).toEqual([1, 2, 2, 3, 3, 3]);
	});

	it("treats missing weight as 1", () => {
		const servers = [{ id: 1 }, { id: 2, weight: 2 }];
		const sequence = buildWeightedSequence(servers);
		expect(sequence.map((s) => s.id)).toEqual([1, 2, 2]);
	});

	it("returns empty for empty servers", () => {
		expect(buildWeightedSequence([])).toEqual([]);
	});
});

describe("getNextWeightedRoundRobin", () => {
	const servers = [
		{ id: 1, weight: 1 },
		{ id: 2, weight: 2 },
		{ id: 3, weight: 3 },
		{ id: 4, weight: 2 },
	];
	// Sequence: [S1, S2, S2, S3, S3, S3, S4, S4] — total weight 8

	it("returns first server at index 0", () => {
		const result = getNextWeightedRoundRobin(servers, 0);
		expect(result).not.toBeNull();
		if (!result) return;
		expect(result.server.id).toBe(1);
		expect(result.nextIndex).toBe(1);
	});

	it("returns null for empty servers", () => {
		expect(getNextWeightedRoundRobin([], 0)).toBeNull();
	});

	it("cycles through weighted sequence correctly", () => {
		const assignments: number[] = [];
		let index = 0;

		for (let i = 0; i < 8; i++) {
			const result = getNextWeightedRoundRobin(servers, index);
			expect(result).not.toBeNull();
			if (!result) return;
			assignments.push(result.server.id);
			index = result.nextIndex;
		}

		// One full cycle: S1, S2, S2, S3, S3, S3, S4, S4
		expect(assignments).toEqual([1, 2, 2, 3, 3, 3, 4, 4]);
	});

	it("distributes 8 requests in 1:2:3:2 ratio", () => {
		const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
		let index = 0;

		for (let i = 0; i < 8; i++) {
			const result = getNextWeightedRoundRobin(servers, index);
			expect(result).not.toBeNull();
			if (!result) return;
			counts[result.server.id]++;
			index = result.nextIndex;
		}

		expect(counts).toEqual({ 1: 1, 2: 2, 3: 3, 4: 2 });
	});

	it("distributes 16 requests (2 cycles) in 2:4:6:4 ratio", () => {
		const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
		let index = 0;

		for (let i = 0; i < 16; i++) {
			const result = getNextWeightedRoundRobin(servers, index);
			expect(result).not.toBeNull();
			if (!result) return;
			counts[result.server.id]++;
			index = result.nextIndex;
		}

		expect(counts).toEqual({ 1: 2, 2: 4, 3: 6, 4: 4 });
	});

	it("continues from where previous batch left off (simulates re-click)", () => {
		const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
		let index = 0;

		// First batch: 5 requests
		for (let i = 0; i < 5; i++) {
			const result = getNextWeightedRoundRobin(servers, index);
			expect(result).not.toBeNull();
			if (!result) return;
			counts[result.server.id]++;
			index = result.nextIndex;
		}

		// First 5 in sequence: S1, S2, S2, S3, S3
		expect(counts).toEqual({ 1: 1, 2: 2, 3: 2, 4: 0 });

		// Second batch: 3 more requests (completes the cycle)
		for (let i = 0; i < 3; i++) {
			const result = getNextWeightedRoundRobin(servers, index);
			expect(result).not.toBeNull();
			if (!result) return;
			counts[result.server.id]++;
			index = result.nextIndex;
		}

		// Full cycle completed: 1:2:3:2
		expect(counts).toEqual({ 1: 1, 2: 2, 3: 3, 4: 2 });
	});

	it("wraps around correctly at sequence boundary", () => {
		// Start at index 7 (last slot = S4), next should wrap to index 0 (S1)
		const result1 = getNextWeightedRoundRobin(servers, 7);
		expect(result1).not.toBeNull();
		if (!result1) return;
		expect(result1.server.id).toBe(4);
		expect(result1.nextIndex).toBe(0);

		const result2 = getNextWeightedRoundRobin(servers, result1.nextIndex);
		expect(result2).not.toBeNull();
		if (!result2) return;
		expect(result2.server.id).toBe(1);
	});

	it("handles weight change (rebuilt sequence)", () => {
		// Change S1 weight from 1 to 3
		const updatedServers = [
			{ id: 1, weight: 3 },
			{ id: 2, weight: 2 },
			{ id: 3, weight: 3 },
			{ id: 4, weight: 2 },
		];
		// New sequence: [S1,S1,S1, S2,S2, S3,S3,S3, S4,S4] — total 10

		const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
		let index = 0;

		for (let i = 0; i < 10; i++) {
			const result = getNextWeightedRoundRobin(updatedServers, index);
			expect(result).not.toBeNull();
			if (!result) return;
			counts[result.server.id]++;
			index = result.nextIndex;
		}

		expect(counts).toEqual({ 1: 3, 2: 2, 3: 3, 4: 2 });
	});

	it("sends 15 requests with default weights (1:2:3:2)", () => {
		const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
		let index = 0;

		for (let i = 0; i < 15; i++) {
			const result = getNextWeightedRoundRobin(servers, index);
			expect(result).not.toBeNull();
			if (!result) return;
			counts[result.server.id]++;
			index = result.nextIndex;
		}

		// 15 = 1 full cycle (8) + 7 partial
		// Full: S1:1, S2:2, S3:3, S4:2
		// Partial 7: S1:1, S2:2, S3:3, S4:1
		// Total: S1:2, S2:4, S3:6, S4:3
		expect(counts).toEqual({ 1: 2, 2: 4, 3: 6, 4: 3 });
	});
});
