# ai-game-evaluation Specification

## Purpose
Define the bounded, deterministic JSON interface used by AI agents to simulate, inspect, and compare game runs without exposing hidden state.
## Requirements
### Requirement: Versioned evaluation contract

The evaluator SHALL accept one versioned JSON request and return one JSON response for `simulate_batch`, `inspect_run`, or `compare_rules`.

#### Scenario: Valid request through the CLI
- **WHEN** an AI caller supplies a schema version 1 request by file or standard input
- **THEN** the CLI writes only the corresponding machine-readable JSON response to standard output

#### Scenario: Invalid request
- **WHEN** an operation, starter, policy, override, or run limit is invalid
- **THEN** the evaluator fails with a concise validation error without running a partial experiment

### Requirement: Local batch aggregation

`simulate_batch` SHALL execute every requested seed locally with a deterministic built-in policy and SHALL return aggregate campaign and per-stage metrics without raw per-hand logs.

#### Scenario: Many requested seeds
- **WHEN** a caller requests 200 runs for each of three starters
- **THEN** one response contains win rates, stage quantiles, bounded alerts, and representative seed identifiers rather than 600 complete traces

### Requirement: Compact representative run inspection

`inspect_run` SHALL replay one seed and return no more than eight stage summaries containing outcomes, resources used, best hand information, generals, triggers, and post-stage purchases.

#### Scenario: Inspecting a high-roll seed
- **WHEN** a caller submits a seed returned by `simulate_batch`
- **THEN** the response explains the stage-level source of the high roll without exposing hidden future draw order or random state

### Requirement: Paired transient rule comparison

`compare_rules` SHALL execute named numeric variants over identical seeds and SHALL compare each variant with a named baseline without modifying source configuration or persisted saves.

#### Scenario: Comparing Liu Bei and target variants
- **WHEN** a caller compares a lower Liu Bei multiplier and a higher stage target against current rules
- **THEN** the response contains bounded win-rate and largest stage-metric deltas for each variant

### Requirement: Evaluation isolation

Evaluation tuning SHALL be optional, transient, and absent from normal gameplay state and packaged player behavior.

#### Scenario: Empty overrides
- **WHEN** an evaluator runs with no numeric override
- **THEN** its action results match the default core rules for the same seed and actions

