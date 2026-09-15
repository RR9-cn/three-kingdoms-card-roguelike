## ADDED Requirements

### Requirement: Settlement has four readable presentation beats
The playable client SHALL present a completed hand through the ordered beats of lot arrival, set recognition, guest bidding when present, and final hammer price without changing the resolved score.

#### Scenario: A hand contains guest-triggered bidding
- **WHEN** the player submits three lots whose resolved steps contain renewed bids
- **THEN** the selected lots arrive, the formed set is stamped, revealed guest bids appear in causal order, and the final hammer price lands after those bids

#### Scenario: A hand has no renewed bid
- **WHEN** the player submits three lots whose resolved steps contain no renewed bid
- **THEN** the presentation labels it as ordinary settlement and proceeds from set recognition to the final hammer price without showing a guest-bidding claim

### Requirement: Settlement pace remains under player control
The client SHALL provide a persistent fast settlement setting and a direct-result action, and both modes SHALL produce the same saved result as normal settlement.

#### Scenario: Player enables fast settlement
- **WHEN** the player activates fast settlement
- **THEN** subsequent reveal delays are shortened while the causal order remains visible

#### Scenario: Player requests the direct result
- **WHEN** the player activates the direct-result action during settlement
- **THEN** all presentation beats and the resolved hammer price appear immediately without recalculation

### Requirement: Settlement respects reduced motion
The client SHALL avoid timed motion when the operating system requests reduced motion.

#### Scenario: Reduced motion is active
- **WHEN** a hand enters settlement under a reduced-motion preference
- **THEN** the complete static settlement and final hammer price appear immediately
