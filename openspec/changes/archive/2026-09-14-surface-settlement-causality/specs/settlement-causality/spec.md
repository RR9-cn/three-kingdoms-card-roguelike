## ADDED Requirements

### Requirement: Revealed causal chain
During post-play settlement, the interface SHALL derive a compact causal chain only from score steps that have already been revealed and SHALL place it in the central battle area.

#### Scenario: Additional scoring unfolds
- **WHEN** a general's additional-scoring source, the repeated card score, and response generals are revealed in sequence
- **THEN** the central chain adds the source general, the identified card's additional score, and each revealed response in that same order

#### Scenario: No source has been revealed
- **WHEN** the visible settlement steps contain no additional-scoring source
- **THEN** the central battle area shows no causal-chain placeholder

### Requirement: Hidden random results remain hidden
The causal chain SHALL NOT include an unrevealed pursuit result, future score step, or final score while the existing settlement animation has not revealed it.

#### Scenario: Ma Chao pursuit is pending
- **WHEN** visible steps end before the saved pursuit result is revealed
- **THEN** the causal chain contains no success, failure, or subsequent pursuit node

### Requirement: Existing settlement controls remain intact
The causal chain SHALL preserve the complete ledger, active-general highlight, direct-result action, reduced-motion behavior, wager flow, and keyboard controls.

#### Scenario: Player skips settlement animation
- **WHEN** the player chooses the existing direct-result action
- **THEN** the final score and last completed causal chain appear without changing the saved result

#### Scenario: Reduced motion is enabled
- **WHEN** the operating system requests reduced motion before a hand is played
- **THEN** settlement opens in its completed state with the same final causal chain and no timed reveal requirement

### Requirement: Presentation-only change
The implementation SHALL NOT change score calculation, content values, random streams, save data, Boss state, rewards, or available player actions.

#### Scenario: Existing deterministic result is rendered
- **WHEN** the same saved result is rendered before and after the presentation change
- **THEN** its cards, steps, score, settlement state, and available actions are identical
