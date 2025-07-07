# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit application using Svelte 5.0.0 with TypeScript support. The project is set up with Vite as the build tool and is configured for TypeScript with strict mode enabled.

## Common Commands

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start development server and open in browser
npm run dev -- --open
```

### Building

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Type Checking

```bash
# Run type checking
npm run check

# Run type checking in watch mode
npm run check:watch
```

## Project Structure

- `src/routes/` - Contains page components following the SvelteKit routing structure
- `src/lib/` - Shared components, utilities, and modules imported via the `$lib` alias
- `static/` - Static assets like images, fonts, etc.
- `src/app.html` - Main HTML template

## Configuration

- Using `@sveltejs/adapter-auto` for deployment
- TypeScript with strict mode enabled
- Path aliases configured in the Svelte and TypeScript configuration

## Coding Guidelines

### TypeScript
- Use TypeScript for all components and files
- Define explicit types for all variables, functions, and components
- Avoid using `any` type

### Component Structure
- Follow Svelte 5 component conventions
- Group related functions and variables
- Keep component logic focused on a single responsibility

### Styling
- Use component-scoped styles
- Follow consistent naming conventions for CSS classes
- Use CSS variables for theming

### File Organization
- Place reusable components in `src/lib/components/`
- Store utility functions in `src/lib/utils/`
- Define interfaces and types in `src/lib/types.ts`
- Keep store definitions in `src/lib/store.ts`

### Naming Conventions
- PascalCase for components (e.g., `ActivityTracker.svelte`)
- camelCase for functions and variables
- Descriptive, purpose-revealing names for all identifiers