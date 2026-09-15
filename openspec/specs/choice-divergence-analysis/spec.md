# choice-divergence-analysis Specification

## Purpose
Define the deterministic internal analysis used to distinguish choice-changing generals from effects that only amplify score.
## Requirements
### Requirement: Deterministic shared-hand analysis
The analysis tool SHALL evaluate every three-card choice from the same seeded six-card samples for every compared build by using the production deterministic preview rules without advancing or exposing hidden random outcomes.

#### Scenario: Repeating an analysis
- **WHEN** the tool runs twice with the same seed, sample count, content version, and build definitions
- **THEN** both runs produce identical structured metrics and sample identifiers

#### Scenario: Random pursuit remains hidden
- **WHEN** a compared build contains a general whose continuation is resolved randomly after play
- **THEN** the analysis uses only guaranteed preview value and does not sample or reveal the future pursuit result

### Requirement: Tie-aware best-choice comparison
The analysis tool SHALL enumerate all valid three-card choices, retain every choice tied for the highest guaranteed score, and count a choice change only when the before and after optimal-choice sets have no shared choice.

#### Scenario: Two builds share a tied optimum
- **WHEN** two builds have at least one identical three-card choice among their respective highest-scoring choices
- **THEN** the comparison records a shared optimum rather than an artificial choice change

### Requirement: Separate decision influence from score amplification
The analysis tool SHALL report, for every active general, the rate at which adding that general changes the optimal three-card choice separately from its guaranteed score uplift across zero-, one-, and two-general contexts.

#### Scenario: General raises score without changing the hand
- **WHEN** adding a general increases guaranteed score while leaving an overlapping optimal choice
- **THEN** the score uplift contributes to amplification metrics and the sample does not contribute to choice-change metrics

### Requirement: Inspectable evidence reports
The analysis tool SHALL write a versioned JSON report and a human-readable Markdown report containing the input boundary, aggregate metrics, formation concentration, trigger-source concentration, and candidates for manual review without claiming automatic balance conclusions.

#### Scenario: Generate reports from the repository command
- **WHEN** a developer runs the documented choice-analysis command
- **THEN** both evidence files are refreshed and identify the seed, sample count, content version, and deterministic-preview limitation

### Requirement: No player-facing behavior change
The analysis capability SHALL remain isolated from runtime gameplay and SHALL NOT modify content values, save schemas, browser behavior, or desktop packaging behavior.

#### Scenario: Build and gameplay tests after adding analysis
- **WHEN** the existing typecheck, rule tests, and production build run after the analysis tool is added
- **THEN** they continue to use the unchanged v0.7 runtime rules and content

