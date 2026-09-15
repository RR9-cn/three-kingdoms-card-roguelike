# unified-post-battle-shop Specification

## Purpose
Place paid guest invitations and catalog edits in one backstage market so permanent growth competes for the same cash.

## Requirements
### Requirement: New victories enter one post-battle shop
After a non-final successful auction, the game SHALL award the existing cash income and enter a backstage market containing three guest invitations and one revealed random catalog edit without entering the legacy free recruitment phase.

#### Scenario: Player clears a normal stage
- **WHEN** the settled hammer price reaches the stage target and the player advances
- **THEN** the next phase is the backstage market, three guest invitations are present, and one legal catalog edit is visible

#### Scenario: Player completes the final stage and continues
- **WHEN** the player chooses endless continuation after stage eight
- **THEN** the existing continuation income is awarded and the backstage market is prepared

### Requirement: Generals are acquired through spending
New campaign flow SHALL acquire guests only through the opening choice or paid backstage invitations and SHALL NOT grant a free post-stage guest choice or skip compensation.

#### Scenario: Player invites a guest
- **WHEN** the player has enough cash and purchases a valid guest invitation
- **THEN** the existing price, slot, and replacement rules apply

### Requirement: Revealed edits cost a flat amount
The backstage market SHALL reveal one legal catalog edit before purchase, charge exactly 8 cash when the player accepts it, and allow the player to choose the edit target using the existing rules.

#### Scenario: Player purchases the revealed edit
- **WHEN** the player has at least 8 cash and accepts the catalog edit
- **THEN** 8 cash is deducted and the game opens the target selection for that revealed edit

#### Scenario: Player cannot afford the revealed edit
- **WHEN** the player has fewer than 8 cash
- **THEN** the edit purchase is unavailable and no cash or state is changed

#### Scenario: Player completes the purchased edit
- **WHEN** the player chooses a legal edit target
- **THEN** the edit applies once, the offer is consumed, and the player returns to the same backstage market

#### Scenario: Player leaves without buying the edit
- **WHEN** the player departs the backstage market while an edit remains offered
- **THEN** the offer is discarded without granting compensation

### Requirement: In-progress legacy rewards remain completable
The system SHALL continue to load valid saves already in the former recruitment or edit phase and SHALL route them into the backstage market after the current legacy choice completes.

#### Scenario: Legacy recruitment save continues
- **WHEN** a valid save is loaded in the former recruitment phase
- **THEN** its current choice can complete and subsequent rewards use the backstage market

#### Scenario: Legacy edit save continues
- **WHEN** a valid save is loaded with an already revealed edit awaiting a target
- **THEN** the player can complete that edit without an additional purchase and then reaches the backstage market
