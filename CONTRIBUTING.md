# Contributing

Thank you for your interest in contributing to the Swiss Drug Shortage Tracker.

## Getting Started

1. Fork the repository
2. Clone your fork and install dependencies:
   ```bash
   git clone https://github.com/<your-username>/drugshortage.git
   cd drugshortage
   npm install
   ```
3. Create a `.env.local` file (see [README.md](README.md))
4. Run the scraper to populate local data:
   ```bash
   npm run scrape
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```

## Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Make your changes
3. Run tests and lint before committing:
   ```bash
   npm test
   npm run lint
   ```
4. Open a Pull Request against `main`

## Code Style

- TypeScript strict mode — no `any`, no untyped exports
- Keep files under 500 lines; one clear responsibility per file
- Follow existing patterns — Server Components for data, Client Components for interactivity
- No comments unless the logic is non-obvious

## Tests

- All new logic in `src/lib/` requires tests in `tests/lib/`
- API routes require tests in `tests/api/`
- UI components do not require tests
- Run `npm test` — all suites must pass before opening a PR

## Commit Messages

Use conventional commits:

```
feat: add ATC filter dropdown
fix: correct sort direction on first click
chore: bump dependencies
```

## Reporting Issues

Open an issue on GitHub with:
- Steps to reproduce
- Expected vs. actual behaviour
- Node.js version (`node -v`)

## Data Source

All data comes from [drugshortage.ch](https://www.drugshortage.ch). This project is not affiliated with or endorsed by drugshortage.ch. Please be respectful with scrape frequency.
