# Contributing to engpass.radar

Thank you for your interest in contributing. This document covers everything you need to get started.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork and install dependencies:
   ```bash
   git clone https://github.com/<your-username>/engpassradar.git
   cd engpassradar
   pnpm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your values (see [README.md](README.md))
4. Set up the database:
   ```bash
   pnpm prisma migrate deploy
   pnpm prisma generate
   ```
5. Populate local data:
   ```bash
   pnpm run scrape
   ```
6. Start the dev server:
   ```bash
   pnpm dev
   ```

## Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Make your changes — keep PRs focused and small
3. Run tests and lint before committing:
   ```bash
   pnpm test
   pnpm lint
   ```
4. Open a Pull Request against `main`

## Code Style

- TypeScript strict mode — no `any`, use `unknown` and narrow properly
- Keep files under 500 lines; one clear responsibility per file
- Server Components for data fetching, Client Components for interactivity
- No comments unless the *why* is non-obvious — never narrate the *what*
- All database access goes through `src/lib/db.ts` — never query Prisma directly from routes

## Tests

- New logic in `src/lib/` → tests in `tests/lib/`
- New API routes → tests in `tests/api/`
- UI components do not require tests
- All suites must pass: `pnpm test`

## Database Changes

- Schema changes go in `prisma/schema.prisma` only
- Never write raw SQL migration files — use `pnpm prisma migrate dev --name <description>`
- All indexes must be defined in the schema, not in separate SQL files

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add ATC filter dropdown
fix: correct sort direction on first click
chore: bump dependencies
docs: update API endpoint table
```

No emojis. Imperative mood. Present tense.

## Reporting Issues

Use the GitHub issue templates. Include:
- Steps to reproduce
- Expected vs. actual behaviour
- Node.js version (`node -v`)
- Browser (for UI issues)

## Data Sources

This project scrapes publicly available data from:
- [drugshortage.ch](https://www.drugshortage.ch)
- [bwl.admin.ch](https://www.bwl.admin.ch)
- [USB Basel Spitalpharmazie](https://www.unispital-basel.ch)

This project is not affiliated with or endorsed by any of these sources. Be respectful with scrape frequency — the daily cron at 03:00 UTC is sufficient.
