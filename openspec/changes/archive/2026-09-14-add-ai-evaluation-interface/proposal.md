## Why

AI analysis should not spend one model interaction per hand or per seed. The repository already runs deterministic local strategies, but it lacks a stable, request-driven interface that returns compact stage distributions, representative runs, and paired rule comparisons.

## What Changes

- Add a versioned JSON request/response evaluation interface callable through one CLI command.
- Add `simulate_batch` for aggregated stage and campaign metrics across many local seeds.
- Add `inspect_run` for a compact stage-by-stage trace of one representative run.
- Add `compare_rules` for paired in-memory numeric overrides without editing source files.
- Bound output size by returning quantiles, alerts, and a small number of representative seeds instead of raw run logs.
- Keep evaluation code outside the shipped game and prohibit access to hidden draw order when choosing actions.

## Capabilities

### New Capabilities

- `ai-game-evaluation`: Versioned local batch simulation, compact inspection, and paired numeric comparison for AI-assisted game balancing.

### Modified Capabilities

None.

## Impact

Adds a reusable evaluation module, a JSON CLI entry point, tests, npm scripts, and documentation. No player-facing rule, content, save, UI, package, or runtime dependency changes.
