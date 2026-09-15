# settlement-causality Specification

## Purpose
Show only the already revealed portion of a renewed-bidding chain in the central auction presentation.

## Requirements
### Requirement: Revealed causal chain
During post-selection settlement, the interface SHALL derive a compact bidding chain only from score steps that have already been revealed and SHALL place it in the central auction area.

#### Scenario: Renewed bidding unfolds
- **WHEN** a guest's renewed-bid source, the selected lot's additional value, and responding guests are revealed in sequence
- **THEN** the central chain adds the source guest, the identified lot's renewed bid, and each revealed response in that same order

#### Scenario: No renewed-bid source has been revealed
- **WHEN** the visible settlement steps contain no renewed-bid source
- **THEN** the central auction area shows no bidding-chain placeholder

### Requirement: Hidden random results remain hidden
The bidding chain SHALL NOT include an unrevealed random follow-up, future score step, or hammer price while settlement has not revealed it.

#### Scenario: A renewed bid is pending
- **WHEN** visible steps end before the saved random result is revealed
- **THEN** the bidding chain contains no success, failure, or subsequent follow-up node

### Requirement: Existing settlement controls remain intact
The bidding chain SHALL preserve the complete ledger, active-guest highlight, direct-result action, reduced-motion behavior, direct settlement, and keyboard controls.

#### Scenario: Player skips settlement animation
- **WHEN** the player chooses the existing direct-result action
- **THEN** the hammer price and last completed bidding chain appear without changing the saved result

#### Scenario: Reduced motion is enabled
- **WHEN** the operating system requests reduced motion before lots are selected
- **THEN** settlement opens in its completed state with the same final bidding chain and no timed reveal requirement

### Requirement: Presentation-only change
The implementation SHALL NOT change score calculation, content values, random streams, save data, signature-buyer state, rewards, or available player actions.

#### Scenario: Existing deterministic result is rendered
- **WHEN** the same saved result is rendered before and after the presentation change
- **THEN** its lots, steps, score, settlement state, and available actions are identical
