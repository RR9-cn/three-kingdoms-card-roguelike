## 1. Analysis Core

- [x] 1.1 Implement deterministic six-card sampling and tie-aware enumeration of every three-card choice
- [x] 1.2 Compute per-general marginal choice-change and guaranteed score-amplification metrics across zero-, one-, and two-general contexts
- [x] 1.3 Compute build overlap, best-versus-second margin, formation concentration, and trigger-source concentration

## 2. Evidence and Interface

- [x] 2.1 Add a repository command that writes versioned JSON and Markdown evidence reports
- [x] 2.2 Document the diagnostic boundary and ensure the report identifies manual-review candidates without automatic balance claims

## 3. Verification

- [x] 3.1 Add meaningful tests for deterministic output, tied optima, marginal choice changes, and hidden-random boundaries
- [x] 3.2 Run the analysis and inspect its conclusions against the current twelve-general roster
- [x] 3.3 Run typecheck, rule tests, production build, and OpenSpec validation without changing player-facing behavior
