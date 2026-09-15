# general-combo-chain Specification

## Purpose
Define how freely combined generals start, respond to, and extend shared additional-scoring events.
## Requirements
### Requirement: Multiple generals can start additional scoring
The system SHALL allow pair, exactly-three-shared-suit, straight, and rightmost-card generals to start deterministic additional scoring for their specified cards, and SHALL preserve every event when multiple sources target the same card.

#### Scenario: Two sources target one card
- **WHEN** a played hand satisfies two held source generals and both select the same physical card
- **THEN** that card receives one additional scoring event from each source

### Requirement: Responses accept every additional scoring source
The system SHALL treat deterministic retriggers and successful pursuit as the same additional scoring action for per-card effects, Guan Yu growth, Ma Chao pursuit, and Lu Xun amplification.

#### Scenario: Non-pair source starts a chain
- **WHEN** Zhuge Liang, Zhou Yu, or Zhao Yun causes an additional scoring event while Ma Chao and Lu Xun are held
- **THEN** Ma Chao can pursue from that event and Lu Xun amplifies every actual additional scoring event

### Requirement: Pursuit remains bounded and reproducible
The system SHALL use the existing enemy random stream for pursuit, SHALL cap successful pursuit at three events per hand, and SHALL exclude random pursuit from the guaranteed preview.

#### Scenario: Preview and resolved floor
- **WHEN** the same state and cards are previewed and then played
- **THEN** the resolved score floor equals the preview and all pursuit outcomes reproduce from the saved random state

### Requirement: Existing game shape remains unchanged
The system SHALL keep three-card play, six formations, five general slots, current resources, active roster size, and save schema unchanged.

#### Scenario: Existing save is loaded
- **WHEN** a valid schema 8 save containing any stable general ID is restored
- **THEN** it remains valid and can continue under the shared additional-scoring rules
