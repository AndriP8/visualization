# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive educational platform for visualizing full-stack engineering concepts through animated demos. Target audience: mid-to-senior engineers preparing for interviews or deepening mental models.

Topics covered: React internals, JavaScript runtime, browser mechanics, database engines, and system design patterns.

## Essential Commands

```bash
# Package manager: ALWAYS use pnpm (never npm or yarn)
pnpm install         # Install dependencies
pnpm dev             # Start dev server
pnpm build           # Build for production (runs TypeScript check first)
pnpm preview         # Preview production build
pnpm lint            # Run Biome linter & formatter (auto-fixes)
pnpm test            # Run Vitest test suite
```

## Architecture Patterns

### 1. Route-Based Organization

**File-based routing with TanStack Router:**
- Routes live in `src/routes/*.tsx` (e.g., `src/routes/caching-strategies.tsx`)
- Each route exports `Route = createFileRoute("/path")({ component: YourPage })`
- Navigation is defined in `src/routes/__root.tsx` in the `NAV_GROUPS` constant
- Routes are type-safe and auto-generated via `src/routeTree.gen.ts` (do not edit manually)

**Adding a new visualization:**
1. Create `src/routes/your-topic.tsx` with `createFileRoute`
2. Add entry to `NAV_GROUPS` in `src/routes/__root.tsx` under appropriate category
3. Build components in `src/components/your-topic/`

### 2. Component Structure

**Domain-organized components:**
```
src/components/
├── caching-strategies/      # Caching visualizations
├── database-indexing/       # B-Tree, index lookup demos
├── event-loop/              # JS event loop visualizations
├── react-state/             # Re-render propagation
├── shared/                  # Reusable layout components
│   ├── DemoSection.tsx      # Standard demo container
│   ├── ShikiCode.tsx        # Syntax-highlighted code blocks
│   └── PageHeader.tsx       # Animated page headers
└── ...
```

**Each domain directory contains:**
- Multiple `*Demo.tsx` components (e.g., `CacheStampedeDemo.tsx`)
- Self-contained logic, state, and animations
- Imported and composed in route files

### 3. Shared Component Patterns

**DemoSection** - Standard wrapper for visualization sections:
```tsx
<DemoSection
  title="Section Title"
  description="Brief explanation"
>
  <YourDemoComponent />
</DemoSection>
```

**ShikiCode** - Syntax highlighting with Shiki (NOT manual `<p>` tags):
```tsx
<ShikiCode
  language="javascript"  // or "typescript", "python", etc.
  code={`const example = "code here";`}
  showLineNumbers={false}  // optional
  className="text-xs"      // optional sizing
/>
```
- Theme: `vitesse-dark` (configured in ShikiCode component)
- **Never** manually format code with `font-mono` divs and colored `<p>` tags
- Use multi-line template literals for code strings

**PageHeader** - Animated hero section (alternative to manual motion divs):
```tsx
<PageHeader
  topic={{ label: "System Design", color: "amber" }}
  title="Your Title"
  subtitle="Description text"
  gradient={{ from: "amber-400", via: "orange-400", to: "rose-400" }}
/>
```

### 4. Animation Patterns

**Using Framer Motion (`motion` package):**
- Import from `"motion/react"` (aliased name for framer-motion)
- Common patterns:
  - Fade-in on mount: `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`
  - Slide-in: `initial={{ y: 20 }} animate={{ y: 0 }}`
  - AnimatePresence for exit animations
  - `layoutId` for shared element transitions
- Use `motion.div`, `motion.button`, etc.

### 5. Conditional Rendering with ts-pattern

**Use `ts-pattern` for complex conditional logic instead of ternaries or switch statements:**
```tsx
import { match } from "ts-pattern";

// Deriving values from state
const color = match(status)
  .with("success", () => "text-green-400")
  .with("error", () => "text-red-400")
  .with("loading", () => "text-yellow-400")
  .otherwise(() => "text-zinc-400");

// Rendering JSX based on multiple conditions
const content = match({ status, role })
  .with({ status: "loading" }, () => <Spinner />)
  .with({ status: "error" }, () => <ErrorMessage />)
  .with({ status: "success", role: "admin" }, () => <AdminPanel />)
  .otherwise(() => <DefaultView />);
```
- Prefer `match()` over nested ternaries or verbose switch/case
- Use `.with()` for pattern matching, `.otherwise()` as the fallback
- Match on objects for multi-condition logic (e.g., `{ status, role }`)

### 6. TypeScript Conventions

**Strict mode enabled:**
- No `any` types (use `unknown` if truly needed, then narrow)
- Explicit return types preferred for complex functions
- Use `as const` for readonly constants (e.g., `NAV_GROUPS`)
- Interface over type for object shapes
- Type parameters use `T` convention

### 7. Styling with Tailwind v4

**Utility-first approach:**
- Dark theme as default (`bg-zinc-950`, `text-gray-100`)
- Accent colors: violet, cyan, amber, rose
- Spacing: consistent scale (e.g., `space-y-6`, `gap-4`)
- Responsive: mobile-first breakpoints (`lg:`, `md:`)
- Animations: `animate-pulse` for status indicators
- Custom gradients: `bg-linear-to-r` (Tailwind v4 syntax)

**Common color palette:**
- Background: `bg-zinc-900`, `bg-zinc-800`, `bg-zinc-950`
- Borders: `border-zinc-700`, `border-zinc-800`
- Text: `text-zinc-400` (secondary), `text-white` (primary)
- Accents: `text-violet-300`, `text-amber-300`, etc.

## Content Structure Guidelines

**Topic types and their structure:**

### Type A: Explanatory/Internals
*Examples: Event Loop, Critical Rendering Path, B-Trees, Memory Management*

Structure:
- **What** - Define concept (1-2 sentences)
- **Why it matters** - Real-world relevance
- **Show** - Interactive visualization
- **How** - Mechanics/implementation details

### Type B: Patterns/Solutions
*Examples: Caching Strategies, Database Indexing, API Patterns*

Structure:
- **What** - Define pattern/approach
- **Why it matters** - Problem it solves
- **Show** - Interactive visualization
- **How** - Implementation details
- **When** - Trade-offs, when to use X vs Y

### Type C: Debugging/Analysis
*Examples: React Re-renders, Memory Leaks, Performance Bottlenecks*

Structure:
- **What** - The problem/symptom
- **Why it happens** - Root cause
- **Show** - Visualization of the issue
- **How to fix** - Solution steps
- **When to apply** - Recognition patterns

**Principles:**
- Not all sections required - adapt to topic needs
- "What" always comes before "Why"
- Use `PageHeader` for What/Why context
- Use `DemoSection` for each Show/How/When segment

## Code Quality Standards

1. **Always use `pnpm`** as package manager (enforced in README)
2. **Run `pnpm lint` before commits** - Biome auto-fixes formatting
3. **TypeScript strict mode** - No `any`, explicit types
4. **Code over comments** - Self-documenting code preferred
5. **Correctness over convenience** - Challenge fragile patterns before implementing

## Testing

- Framework: Vitest with jsdom environment
- Config: `vite.config.ts` (inline test config with `/// <reference types="vitest" />`)
- Setup: `vitest.setup.ts` (imported automatically)
- Run: `pnpm test`

## Common Gotchas

1. **Route generation**: `src/routeTree.gen.ts` is auto-generated - never edit manually
2. **Import from motion**: Use `"motion/react"`, not `"framer-motion"`
3. **Shiki code blocks**: Always use `ShikiCode` component, not manual formatting
4. **Navigation updates**: Add new routes to BOTH `src/routes/` AND `NAV_GROUPS` in `__root.tsx`
5. **Tailwind v4 syntax**: Uses `bg-linear-to-r` instead of `bg-gradient-to-r`

## Adding a New Visualization (Step-by-Step)

1. Create component directory: `src/components/your-topic/`
2. Build demo components: `YourTopicDemo.tsx`, etc.
3. Create route file: `src/routes/your-topic.tsx`
4. Export route: `createFileRoute("/your-topic")({ component: YourPage })`
5. Update navigation: Add to `NAV_GROUPS` in `src/routes/__root.tsx`
6. Use shared components: `DemoSection`, `ShikiCode`, `PageHeader`
7. Test locally: `pnpm dev`
8. Lint: `pnpm lint`
9. Build: `pnpm build`
