# choice-shaping-generals Specification

## Purpose
Record the acceptance gate for bounded general-rule experiments and require failed candidates to leave player behavior unchanged.
## Requirements
### Requirement: Bounded two-general experiment
The experiment SHALL change only Lu Xun and Zhuge Liang, SHALL reuse existing rank, hand-order, and additional-scoring concepts, and SHALL keep every other gameplay and presentation rule frozen during measurement.

#### Scenario: Run a candidate rule set
- **WHEN** a candidate Lu Xun and Zhuge Liang rule set is evaluated
- **THEN** it uses the committed v0.7 choice report and campaign seeds as its baseline without changing any unrelated rule

### Requirement: Choice and campaign acceptance gate
The experiment SHALL compare individual choice-change rates, overall single-general optimal-choice overlap, deterministic score uplift, and three-starter campaign results before retaining a candidate.

#### Scenario: Individual metrics improve but the game regresses
- **WHEN** candidate generals change their own optimal choices more often but overall choice overlap does not improve or campaign results become substantially skewed
- **THEN** the candidate fails the acceptance gate and SHALL NOT enter the player runtime

### Requirement: Failed candidates leave no runtime change
When a candidate fails the acceptance gate, the implementation SHALL restore the prior Lu Xun and Zhuge Liang behavior, generated content, rule documentation, tests, and campaign evidence while preserving a written experiment record.

#### Scenario: Both tested candidates fail
- **WHEN** the high-compensation and reduced-compensation variants both fail the acceptance gate
- **THEN** the repository retains the original v0.7 player behavior and records why further numerical patching was stopped

