# Web Development Concepts Visualizer

An interactive platform built to demonstrate and explain core web development and computer science concepts through engaging, interactive visualizations. From React's internal mechanisms to the browser's rendering phase and JavaScript execution environment, this project aims to make abstract technical processes easier to understand.

## 🎯 Purpose

This project is designed to be a **general-purpose visualization hub**. Rather than focusing on a single feature, it is built with an extensible architecture that allows developers to easily add new interactive demos, educational modules, and technical deep-dives over time.

## ✨ Current Visualizations

- **React Reconciliation**: Visualizing how React updates the DOM, including tree diffing, element type changes, and the importance of keys in list rendering.
- **Critical Rendering Path (CRP)**: Interactive demos explaining how the browser parses HTML, CSS, and JavaScript, highlighting the impact of render-blocking resources.
- **JavaScript Event Loop**: A step-by-step visualizer for the Call Stack, Web APIs, and Task Queues (Microtasks and Macrotasks).
- *(More visualizations spanning algorithms, memory management, and network protocols to come...)*

## 🛠️ Tech Stack

This project is built using modern web development tools and best practices:

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) for strong typing, avoiding `any` and explicit casting.
- **Build Tool**: [Vite](https://vitejs.dev/) for fast development and optimized production builds.
- **Routing**: [TanStack Router](https://tanstack.com/router/latest) for fully type-safe routing.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://motion.dev/) for fluid interactivity and transitions.
- **Syntax Highlighting**: [Shiki](https://shiki.style/)
- **Linting & Formatting**: [Biome](https://biomejs.dev/) for extremely fast, reliable checks.
- **Testing environment**: [Vitest](https://vitest.dev/)

## 🚀 Getting Started

### Prerequisites

We strictly use `pnpm` as the package manager for this project to ensure fast, deterministic installations.

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

Start the development server with Hot Module Replacement (HMR):

```bash
pnpm dev
```

### Other Commands

- **Build for Production**: `pnpm build`
- **Preview Production Build**: `pnpm preview`
- **Run Linter & Formatter**: `pnpm lint`

## 🏗️ Architecture & Project Structure

The project is structured to easily scale and accommodate new visual domains:

```text
src/
├── components/
│   ├── critical-rendering-path/ # Demos for CRP
│   ├── reconciliation/          # Demos for React rendering behavior
│   ├── shared/                  # Reusable layout and demo wrapper components
│   └── ...                      # [New visualization domains go here]
├── routes/                      # Route definitions (auto-generated via TanStack Router)
├── lib/                         # General utilities and types
└── ...
```

## 🧠 Development Philosophy & Rules

If you are expanding this project, please adhere to our strict guiding principles:

1. **Package Manager**: Always use `pnpm`. Do not introduce `npm` or `yarn` lockfiles.
2. **Strict TypeScript**: We enforce rigorous typing. Avoid using `any` and bypass type narrowing with explicit casting (`as`) only when absolutely unavoidable.
3. **Correctness over Convenience**: Code should be written utilizing established best practices. If a proposed design pattern or architectural choice seems fragile or short-sighted, it should be challenged and revised before implementation.
4. **Tooling**: Rely on Biome for linting and formatting, and Vitest for any unit/integration test suites.

## 🤝 Contributing New Visualizations

To add a new feature or interactive demo:
1. Create a new categorized directory under `src/components/` (e.g., `src/components/memory-management/`).
2. Build isolated, reusable interactive components that illustrate your specific concept.
3. Use the components from `src/components/shared/` to maintain a consistent look and feel across all demos.
4. Define a new route in `src/routes/` to surface your visualization.
5. Run `pnpm lint` to ensure code style compliance before committing.
