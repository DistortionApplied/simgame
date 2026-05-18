# Architecture Overview

simgame is a Next.js application that simulates a Linux terminal environment with a fully mock internet layer.

## High-Level Structure

- **Terminal Core** (`components/Terminal.tsx`)
  - Handles command parsing, execution, history, autocomplete, and output
  - Integrates with virtual filesystem and user system
  - Contains most command implementations and help text logic

- **Virtual Filesystem** (`lib/filesystem.ts` or similar)
  - In-memory + localStorage persisted directory tree
  - Supports permissions, ownership, and realistic metadata

- **Mock Internet Layer** (`lib/internet.ts`)
  - `MockInternet` class with procedural generation
  - DNS, Websites, Servers, Services, and IP simulation
  - Persisted per-user in localStorage
  - Powers `browser`, `nmap`, `ping`, `whois`, `ifconfig`, and `apt`

- **Browser & Websites** (`components/GraphicalBrowser.tsx`, `components/Googo.tsx`, `components/GeeMail.tsx`, etc.)
  - Simulated browser UI with navigation, history, and loading states
  - Individual website components (Googo, Geemail, Spamazon, etc.)
  - All content is static or procedurally generated — no real network calls

## Key Design Principles

1. **Everything is Simulated** — No real networking or external dependencies
2. **Backward Compatibility** — Changes must not break existing saves or core terminal behavior
3. **Grey Hack Inspiration** — Focus on realistic single-player feel (loading states, interactivity, discovery)
4. **Persistence First** — All state (filesystem, users, internet) survives page reloads via localStorage

## Data Flow

```
User Input → Terminal → Command Handler → MockInternet / Filesystem → React State + localStorage
```

## Current State (as of May 2026)

- Core terminal is feature-complete with 35+ commands
- Command history now includes failed commands
- Tab autocomplete supports `sudo` / `su` prefix
- Mock internet and browser functionality implemented
- Active development focused on improving mock internet realism (apt, Googo search, loading states)

For implementation details of specific commands or websites, see the source files directly.