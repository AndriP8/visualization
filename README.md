# Under the Hood

An interactive platform for learning and internalizing core concepts across software engineering — from browser internals and React mechanics to database engines, system design patterns, web security, and AI/LLM engineering. Every topic is taught through hands-on, animated visualizations rather than static text.

## 🎯 Purpose

This project is a **general-purpose visualization hub** for software engineering and AI concepts. It is built with an extensible, domain-organized architecture that makes it straightforward to add new interactive demos, educational modules, and technical deep-dives over time. The target audience is mid-to-senior engineers preparing for interviews or deepening their mental models.

## ✨ Visualizations

### 🌳 React
- **React Reconciliation** — Tree diffing, Fiber nodes, element type changes, and the role of `key` in list rendering.
- **State & Re-renders** — What triggers re-renders, how they propagate, batching in React 18, context traps, and `useMemo`/`useCallback` reference stability.
- **Concurrent Features** — How React 18 transitions (`useTransition`), `useDeferredValue`, and Suspense keep UIs responsive by interleaving work and prioritizing urgent updates.
- **State Machines** — Finite State Machines with XState to eliminate impossible states and edge-case race conditions.
- **Server Components (RSC)** — Server vs. Client boundaries, Flight serialization format, and streaming hydration.

### ⚡ JavaScript
- **Closure & Lexical Scope** — Lexical scope chain lookup, closure snapshots, stale closure bugs in React, and the classic `var` loop bug.
- **Memory & Garbage Collection** — Stack vs. heap allocation, mark-and-sweep GC, V8 generational memory management, and React memory leak patterns.
- **JavaScript Event Loop** — Step-by-step visualizer for the Call Stack, Web APIs, Microtask Queue, Macrotask Queue, and `requestAnimationFrame`.
- **Web Workers** — Multithreaded JavaScript execution using `postMessage`, `Transferable` objects, and `SharedWorker`.
- **Async Patterns & Promises** — Under-the-hood mechanics of `async`/`await`, `Promise` combinators (`Promise.all`, `allSettled`, `race`), race conditions, and error handling.

### 🎨 Browser
- **Critical Rendering Path** — How the browser parses HTML, CSS, and JS; render-blocking resources, DOM/CSSOM tree construction, layout, paint, and compositing.
- **Web Performance Metrics** — Core Web Vitals deep dive: LCP, CLS, INP, FCP, and TTFB measurement and optimization strategies.
- **Resource Loading Priority** — Browser fetch prioritization algorithms and how developer hints (`preload`, `prefetch`, `async`, `defer`) affect the network waterfall.

### 🌍 Web
- **Rendering Strategies** — CSR, SSR, SSG, ISR, Streaming SSR, and PPR compared via animated timelines, trade-off matrix, and an interactive use-case matcher.

### 🗄️ Database
- **Database Indexing** — Full table scan vs. B-Tree index lookup, B-Tree structure explorer with animated node splits, clustered vs. non-clustered indexes, and when NOT to index.
- **SQL Execution Order** — Written order vs. actual execution order (`FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT`), data flow pipeline, and common query pitfalls.
- **Transactions & Isolation Levels** — ACID properties, concurrency anomalies (dirty reads, phantom reads, non-repeatable reads), isolation level matrix, and MVCC.
- **Query Engine Flow** — Internal PostgreSQL-style pipeline: Parser → Planner → Optimizer → Execution Engine, including EXPLAIN ANALYZE output visualization.

### 🏗️ System Design
- **Caching Strategies** — Full caching layer stack (browser → CDN → Redis → DB), cache invalidation patterns, HTTP cache headers, and cache stampede mitigations.
- **API Communication Patterns** — REST, GraphQL, tRPC, WebSockets, and Server-Sent Events (SSE) compared for performance, type safety, and real-time capabilities.
- **Load Balancing Strategies** — Round-robin, least connections, weighted routing, and consistent hashing across distributed server clusters.

### 🌐 Network
- **HTTP/1.1 vs HTTP/2** — Multiplexing, binary framing layers, HPACK header compression, and head-of-line (HOL) blocking resolution.
- **WebRTC Data & Media** — Peer-to-peer real-time communication: ICE candidate gathering, STUN/TURN NAT traversal, SDP offer/answer handshake, and DataChannel protocol.

### 🛡️ Web Security
- **Authentication Flows** — Session-based cookies, JWT tokens, and OAuth 2.0 + PKCE identity flows.
- **XSS & CSRF Attacks** — Reflected XSS, stored XSS, Cross-Site Request Forgery mechanics, Content Security Policy (CSP), `SameSite` cookies, and CORS defenses.

### #️⃣ Data Structures
- **Hash Tables** — Hash functions, bucket arrays, collision resolution (separate chaining vs. open addressing), and load factor resizing.
- **Linked Lists** — Singly, doubly, and circular linked list pointer operations and traversal memory patterns.

### 🤖 AI Engineering
- **Prompt Engineering** — System prompts, few-shot examples, chain-of-thought reasoning, and instruction hierarchy.
- **Vector Embeddings** — High-dimensional semantic mapping, cosine similarity calculations, and vector arithmetic (e.g., King - Man + Woman = Queen).
- **Vector Search** — Exact kNN vs. Approximate Nearest Neighbors (ANN) using HNSW (Hierarchical Navigable Small World) graph indexing.
- **RAG Pipeline** — Retrieval-Augmented Generation: document ingestion, embedding, vector retrieval, reranking, and contextual grounding.
- **Chunking Strategies** — Fixed-size, recursive, and semantic chunking with overlap trade-offs for optimal context retrieval.
- **Streaming & SSE** — Real-time token streaming with Server-Sent Events, backpressure management, cancellation abort signals, and partial JSON handling.
- **Tool Calling** — Model function calling, JSON schema generation, tool response loop execution, and multi-tool orchestration.
- **Structured Output** — Constrained decoding with Finite State Machines (FSM) and JSON schema grammars to guarantee valid structural outputs.
- **Prompt Injection** — Direct and indirect prompt injection attacks, system prompt overrides, exfiltration risks, and guardrail defenses.
- **Fine-Tuning vs. RAG** — Model weight updates vs. dynamic retrieval decision matrix for enterprise AI applications.
- **Agent Loops** — ReAct loop mechanics (Thought → Action → Observation), multi-agent orchestration, planning, and error recovery.
- **Evals & Observability** — OpenTelemetry tracing, span trees, token consumption metrics, latency profiling, and RAG Triad evaluation metrics.
- **Evaluation & Guardrails** — LLM-as-a-Judge rubrics, automated CI prompt regression suites, and real-time input/output safety guardrails.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) — strict typing, no `any`, minimal casting.
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Routing**: [TanStack Router](https://tanstack.com/router/latest) — fully type-safe, file-based routing.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/) (`motion/react`)
- **Syntax Highlighting**: [Shiki](https://shiki.style/)
- **State Pattern**: [ts-pattern](https://github.com/garritej/ts-pattern)
- **Linting & Formatting**: [Biome](https://biomejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

## 🚀 Getting Started

### Prerequisites

We strictly use `pnpm` as the package manager.

```bash
npm install -g pnpm
```

### Installation

1. Clone the repository and navigate into the project directory:
   ```bash
   cd visualization
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

```bash
pnpm dev
```

### Other Commands

| Command | Description |
|---|---|
| `pnpm build` | Typecheck & build for production |
| `pnpm preview` | Preview the production build |
| `pnpm lint` | Run Biome linter & formatter (with auto-fix) |
| `pnpm test` | Run Vitest test suite |

## 🏗️ Project Structure

```text
src/
├── components/
│   ├── ai-*                     # AI Internals & Engineering demos (18 categories)
│   ├── api-patterns/            # REST, GraphQL, WebSocket, SSE
│   ├── async-patterns/          # Promises, async/await, race conditions
│   ├── auth-flows/              # Sessions, JWT, OAuth 2.0 + PKCE
│   ├── caching-strategies/      # Multi-tier cache & invalidation
│   ├── closure-scope/           # Scope chain & stale closures
│   ├── critical-rendering-path/ # DOM/CSSOM, layout, paint
│   ├── database-*/              # Indexing, transactions, SQL execution, query flow
│   ├── event-loop/              # Stack, task queues, microtasks
│   ├── hash-tables/             # Hash functions & collision resolution
│   ├── http-versions/           # HTTP/1.1 vs HTTP/2 multiplexing
│   ├── js-memory/               # Stack/heap allocation & GC
│   ├── linked-lists/            # Singly, doubly, circular linked lists
│   ├── load-balancing/          # Routing algorithms & consistent hashing
│   ├── react-*/                 # Reconciliation, state, concurrent, RSC
│   ├── rendering-strategies/    # CSR, SSR, SSG, ISR, PPR
│   ├── resource-priority/       # Preload, prefetch, async, defer
│   ├── shared/                  # PageHeader, DemoSection, ShikiCode
│   ├── state-machines/          # XState & finite state machines
│   ├── web-performance-metrics/ # Core Web Vitals (LCP, CLS, INP)
│   ├── web-workers/             # Parallel execution & transferables
│   ├── webrtc/                  # Peer-to-peer media & data channels
│   └── xss-csrf/                # Web security attack vectors & defenses
├── routes/                      # TanStack Router file-based routes
├── lib/                         # Shared utilities and types
└── ...
```

## 🧠 Development Philosophy

1. **Package Manager**: Always use `pnpm`.
2. **Strict TypeScript**: No `any`; use explicit casting only when unavoidable.
3. **Correctness over Convenience**: Challenge fragile patterns before implementing them.
4. **Tooling**: Biome for linting/formatting, Vitest for tests.
5. **Animations**: Use `motion/react` import paths.

## 🤝 Contributing New Visualizations

1. Create a new categorized directory under `src/components/` (e.g., `src/components/rate-limiting/`).
2. Build isolated, reusable interactive components wrapped in `DemoSection`.
3. Use components from `src/components/shared/` (`PageHeader`, `DemoSection`, `ShikiCode`) for consistent layout and styling.
4. Define a new route in `src/routes/` using `createFileRoute`.
5. Add the route to the appropriate group in `NAV_GROUPS` in `src/routes/__root.tsx` and `CONCEPT_GROUPS` in `src/routes/index.tsx`.
6. Run `pnpm lint` and `pnpm build` before committing.
