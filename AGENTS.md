# Repository Guidelines

## Project Structure & Module Organization
- `src/routes` hosts SvelteKit pages; the root `+page.svelte` provides the tool launcher while feature routes such as `activity-tracker/+page.svelte` own their UI logic.
- `src/lib` contains reusable modules: `components/` for UI building blocks, `store.ts` for writable stores, `exporter.ts` for utilities, and `types.ts` for shared types exported through `index.ts`.
- `tests` mirrors lib structure under `tests/lib` with Vitest suites, and `tests/setup.ts` wires Testing Library helpers.
- Static assets live in `static/` and ship as-is; generated coverage reports render under `coverage/`.

## Build, Test, and Development Commands
- `npm run dev` launches Vite’s dev server with hot module reload; append `-- --open` to auto-open the browser.
- `npm run build` produces the production bundle; run `npm run preview` to smoke-test the build locally.
- `npm run check` syncs SvelteKit metadata and runs `svelte-check` against `tsconfig.json` for type and markup validation.
- `npm run test` runs the Vitest suite once; use `npm run test:watch` for red/green loops and `npm run coverage` to populate `coverage/` artifacts.

## Coding Style & Naming Conventions
- Favor TypeScript-first Svelte components with `<script lang="ts">`; keep indentation at two spaces and omit trailing commas to match existing code.
- Use PascalCase for components (`ActivityHistory.svelte`), camelCase for functions and stores (`startActivity`, `activities`), and reserve SCREAMING_SNAKE_CASE for constants.
- Prefer named exports and co-locate writable stores with their helpers inside `src/lib/store.ts` style modules.
- Run `npm run check` before pushing; strict TS and bundler-aware module resolution will flag incompatible imports early.

## Testing Guidelines
- Place Vitest specs under `tests/lib/.../*.test.ts` and mirror the module path so failures are easy to trace back to source.
- Use `@testing-library/svelte` assertions (bootstrapped in `tests/setup.ts`) and reset shared stores between tests as shown in `store.test.ts`.
- Target meaningful coverage for store logic and UI interactions; create the HTML report via `npm run coverage` and confirm critical branches stay green.

## Commit & Pull Request Guidelines
- Start commit subjects with an imperative verb and keep them concise (e.g. `Add multi-activity export`); add a short body when extra context or follow-up steps are needed.
- Reference related issues in the PR description, outline validation (`npm run test`, `npm run check`), and attach UI screenshots or GIFs when changing Svelte components.
- Document new user-facing behavior with tests or manual verification notes so reviewers can reproduce changes confidently.
