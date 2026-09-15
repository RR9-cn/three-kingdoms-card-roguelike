# low-rank-multiplier-build Specification

## Purpose
Define Liu Bei as a low-rank multiplier engine that trades base-point bonuses for repeatable multiplier growth.
## Requirements
### Requirement: Liu Bei trades base points for multiplier growth
Whenever a card with rank 4 or lower scores, Liu Bei SHALL add exactly 5 multiplier and SHALL NOT add points.

#### Scenario: A low-rank card scores normally
- **WHEN** a card with rank 4 or lower scores while Liu Bei is owned
- **THEN** the current multiplier increases by 5 and the card receives no points from Liu Bei

#### Scenario: A high-rank card scores
- **WHEN** a card with rank 5 or higher scores while Liu Bei is owned
- **THEN** Liu Bei does not change points or multiplier

#### Scenario: A low-rank card scores again
- **WHEN** an additional-score effect causes a card with rank 4 or lower to score again
- **THEN** Liu Bei adds 5 multiplier for that additional scoring event without adding points

### Requirement: The Liu Bei experiment remains isolated
The Liu Bei adjustment SHALL NOT modify other generals, formation multipliers, stage targets, pursuit probability, reward flow, save shape, or random consumption order.

#### Scenario: Existing systems resolve around Liu Bei
- **WHEN** a run uses any existing formation, general, pursuit, reward, or save behavior
- **THEN** only Liu Bei's removed point gain differs from the preceding version
