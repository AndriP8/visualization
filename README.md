# Full-Stack Concept Visualizer

An interactive platform for learning and internalizing core concepts across the full software engineering stack — from browser internals and React mechanics to database engines, system design patterns, and JavaScript runtime behavior. Every topic is taught through hands-on, animated visualizations rather than static text.

## 🎯 Purpose

This project is a **general-purpose visualization hub** for full-stack engineering concepts. It is built with an extensible, domain-organized architecture that makes it straightforward to add new interactive demos, educational modules, and technical deep-dives over time. The target audience is mid-to-senior engineers preparing for interviews or deepening their mental models.

## ✨ Current & Planned Visualizations

### 🌳 React
- **React Reconciliation** — Tree diffing, element type changes, and the role of `key` in list rendering.
- **State & Re-renders** — What triggers re-renders, how they propagate, batching in React 18, context traps, and `useMemo`/`useCallback` reference stability.

### 🖥️ Browser
- **Critical Rendering Path** — How the browser parses HTML, CSS, and JS; render-blocking resources and their impact.
- **JavaScript Event Loop** — Step-by-step visualizer for the Call Stack, Web APIs, Microtask Queue, and Macrotask Queue.
- **Closure & Scope** — Lexical scope chain lookup, closure snapshots, stale closure bugs in React, and the classic `var` loop bug.
- **Memory & GC** — Stack vs. heap, mark-and-sweep, V8 generational GC, and React memory leak patterns.

### 🗄️ Database
- **Database Indexing** — Full table scan vs. B-Tree index lookup, B-Tree structure explorer with animated node splits, clustered vs. non-clustered indexes, and when NOT to index.
- **Transactions & Isolation Levels** — ACID properties, dirty reads/phantom reads/non-repeatable reads, isolation level matrix, and deadlock visualization.
- **SQL Execution Order** — Written order vs. actual execution order, data flow pipeline, common pitfalls quiz, and subquery/JOIN execution.
- **Query Engine Flow** — Internal PostgreSQL-style pipeline: Parser → Planner → Optimizer → Execution Engine, including EXPLAIN ANALYZE output visualization.

### 🏗️ System Design
- **Caching Strategies** — Full caching layer stack (browser → CDN → Redis → DB), cache invalidation patterns, HTTP cache headers, and cache stampede mitigations.

### 🌍 Web
- **Rendering Strategies** — CSR, SSR, SSG, ISR, and PPR compared via animated timelines, trade-off matrix, and an interactive use-case matcher.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) — strict typing, no `any`, minimal casting.
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Routing**: [TanStack Router](https://tanstack.com/router/latest) — fully type-safe, file-based.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://motion.dev/)
- **Syntax Highlighting**: [Shiki](https://shiki.style/)
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
| `pnpm build` | Build for production |
| `pnpm preview` | Preview the production build |
| `pnpm lint` | Run Biome linter & formatter |
| `pnpm test` | Run Vitest test suite |

## 🏗️ Project Structure

```text
src/
├── components/
│   ├── database-indexing/       # B-Tree, scan vs. index
│   ├── database-transactions/   # ACID, isolation levels, locking
│   ├── sql-execution-order/     # Clause pipeline & pitfalls
│   ├── database-query-flow/     # Parser → Optimizer → Executor
│   ├── react-state/             # Re-render propagation, batching
│   ├── rendering-strategies/    # CSR / SSR / SSG / ISR / PPR
│   ├── closure-scope/           # Lexical scope & closures
│   ├── js-memory/               # GC, heap, React memory leaks
│   ├── caching-strategies/      # Cache layers & invalidation
│   ├── critical-rendering-path/ # Browser CRP demos
│   ├── reconciliation/          # React reconciliation demos
│   ├── shared/                  # Reusable layout & demo wrappers
│   └── ...
├── routes/                      # TanStack Router file-based routes
├── lib/                         # Utilities and shared types
└── ...
```

## 🧠 Development Philosophy

1. **Package Manager**: Always use `pnpm`.
2. **Strict TypeScript**: No `any`; use explicit casting only when unavoidable.
3. **Correctness over Convenience**: Challenge fragile patterns before implementing them.
4. **Tooling**: Biome for linting/formatting, Vitest for tests.

## 🤝 Contributing New Visualizations

1. Create a new categorized directory under `src/components/` (e.g., `src/components/rate-limiting/`).
2. Build isolated, reusable interactive components that illustrate the specific concept.
3. Use components from `src/components/shared/` for consistent layout and styling.
4. Define a new route in `src/routes/` using `createFileRoute`.
5. Add the route to the appropriate nav group in `src/routes/__root.tsx`.
6. Run `pnpm lint` before committing.
