## MODIFIED Requirements

### Requirement: Revealed causal chain
During post-selection settlement, the interface SHALL derive a compact bidding chain only from score steps that have already been revealed and SHALL place it in the central auction area.

#### Scenario: Renewed bidding unfolds
- **WHEN** a guest's renewed-bid source, the selected lot's additional value, and responding guests are revealed in sequence
- **THEN** the central chain adds the source guest, the identified lot's renewed bid, and each revealed response in that same order

#### Scenario: No renewed-bid source has been revealed
- **WHEN** the visible settlement steps contain no renewed-bid source
- **THEN** the central auction area shows no bidding-chain placeholder

