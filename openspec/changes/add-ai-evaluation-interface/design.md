## Context

The existing simulator executes hundreds of deterministic runs in one process, but its inputs and outputs are hard-coded. AI callers need to request a statistical experiment once, receive bounded aggregate output, and inspect only selected outliers. Evaluation decisions must use public `ForgeView` data and must not expose future draw order or random streams.

## Goals / Non-Goals

**Goals:**

- Provide a versioned JSON contract for batch simulation, one-run inspection, and paired tuning comparison.
- Run all seeds locally with deterministic built-in policies.
- Return stage quantiles and at most a small bounded set of alerts and representative seeds.
- Support transient stage-target and Liu Bei multiplier overrides without changing source configuration or saved state.
- Keep the evaluator reusable from a CLI now and an MCP wrapper later.

**Non-Goals:**

- Let a language model choose every hand in a batch.
- Claim that automated policies measure fun or human win rate.
- Add a network server, production dependency, player telemetry, or player-facing UI.
- Persist experimental overrides or use them in packaged gameplay.

## Decisions

1. `tools/ai-eval-lib.ts` owns validation and pure request execution; `tools/ai-eval.ts` only reads one JSON request from a file or stdin and writes one JSON response. This keeps the contract independent of CLI or MCP transport.
2. The contract starts at `schemaVersion: 1` and exposes exactly `simulate_batch`, `inspect_run`, and `compare_rules`. Unknown properties and invalid limits fail with concise errors instead of being silently ignored.
3. Batch actions come from existing `greedy` or `counterplay` policies operating on `ForgeView`. The runner passes optional evaluation tuning to scoring and stage setup, but tuning is never stored in `ForgeState`.
4. Stage targets are 1-based in external JSON and normalized to a complete internal target array. Liu Bei's multiplier is an optional numeric tuning value. Both defaults reproduce the shipped rules.
5. Batch output contains campaign win rate and per-stage reach count, failure rate, one-hand win rate, median hands, median/p90 peak ratio, and median discards. Raw traces remain local. At most twelve alerts and three representative seeds per starter are returned.
6. `compare_rules` uses identical seeds and policies for every variant. It returns overall win-rate deltas and the largest bounded stage metric changes relative to the named baseline.

## Risks / Trade-offs

- [Built-in policy bias] → Label every response with the policy and state that results are regression evidence, not human evaluation.
- [Transient tuning diverges from production paths] → Route both default and overridden simulation through the same core action and preview functions; add parity tests showing empty overrides reproduce normal play.
- [Large requests consume local CPU] → Cap runs per starter and variant count while keeping output size independent of run count.
- [Future metrics expand the contract] → Version the JSON schema and reject unknown operations; add fields compatibly within version 1 only when they remain bounded.
