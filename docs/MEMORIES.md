# Agent Memories & Learnings

- **Tailwind v4 Setup:** The project uses Tailwind v4 `@theme` directive in `index.css`. All tokens (spacing, fonts, radius) must be defined directly in `index.css` under `@theme`.
- **Dark Mode Support:** Ensure that hardcoded hex colors (e.g. `bg-[#F6EEEC]`) are explicitly paired with `dark:` variants (e.g. `dark:bg-surface-container`) or replaced with semantic variables like `bg-surface-container-lowest` so they automatically toggle on dark mode.
- **Vite & React:** Inline styles in React must be objects `{{ width: '14.5%' }}` instead of strings to avoid TypeScript compilation errors in `.tsx` files.

# Agent Memories (Learnings)

- **2026-09-16**: 
  - *Docker on Windows*: Encountered `Access is denied` on named pipe `//./pipe/dockerDesktopLinuxEngine`. This is a common permission/timing issue when Docker is booting. Resolved by ensuring Docker is fully running and using `BypassSandbox: true` for the agent's Docker commands.
  - *PostgreSQL Port Collision*: Port 5432 is frequently occupied by local pgAdmin or background services on Windows. Changed `docker-compose.yml` and `application.yml` to use port **5433** to guarantee a clean environment and prevent `password authentication failed` errors due to hitting the wrong DB instance.

