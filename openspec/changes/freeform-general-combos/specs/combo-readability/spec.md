## ADDED Requirements

### Requirement: General descriptions expose their connection
The system SHALL describe each active scoring general as either starting additional scoring or responding whenever a card scores again, using the same “额外计分” wording.

#### Scenario: Player compares rewards
- **WHEN** the player views generals in recruitment or the shop
- **THEN** compatible generals use matching language without requiring a fixed build label

### Requirement: Settlement shows causal order
The system SHALL name the general that starts each deterministic additional scoring event and SHALL show each responder after the event it responds to.

#### Scenario: Additional scoring chain resolves
- **WHEN** a general causes a card to score again and other generals respond
- **THEN** the ledger shows the source, repeated card score, per-card responses, amplification, and pursuit result in execution order

### Requirement: Product copy does not prescribe fixed engines
The system SHALL present the active roster as freely combinable generals and SHALL remove the three fixed four-general engine prescription from current player-facing content.

#### Scenario: Player starts a new run
- **WHEN** the home, rules, or content description is shown
- **THEN** it invites the player to connect general effects rather than complete one of three named sets
