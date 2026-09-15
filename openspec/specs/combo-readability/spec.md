# combo-readability Specification

## Purpose
Make guest abilities and resolved bidding chains understandable while preserving player discovery of combinations.

## Requirements
### Requirement: General descriptions expose their connection
The system SHALL describe each active guest as either opening a renewed bid or responding whenever a lot receives another bid, using the same “追加竞价” wording.

#### Scenario: Player compares invitations
- **WHEN** the player views guests in the opening choice or backstage market
- **THEN** compatible guests use matching language without requiring a fixed build label

### Requirement: Settlement shows causal order
The system SHALL name the guest that starts each deterministic renewed bid and SHALL show each responder after the bid it responds to.

#### Scenario: Bidding chain resolves
- **WHEN** a guest causes a lot to receive another bid and other guests respond
- **THEN** the ledger shows the source, renewed lot value, per-lot responses, amplification, and random follow-up result in execution order

### Requirement: Product copy does not prescribe fixed engines
The system SHALL present the active roster as freely combinable auction guests and SHALL omit fixed guest recipes from current player-facing content.

#### Scenario: Player starts a new auction
- **WHEN** the home, rules, or content description is shown
- **THEN** it invites the player to connect guest effects rather than complete a named set
