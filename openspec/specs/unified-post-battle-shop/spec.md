# unified-post-battle-shop Specification

## Purpose
Place paid generals and paid card edits in one post-battle shop so permanent growth competes for the same currency.
## Requirements
### Requirement: New victories enter one post-battle shop
After a non-final victory, the game SHALL award the existing battle income and enter a shop containing three general offers and one revealed random edit without entering the free recruitment phase.

#### Scenario: Player wins a normal stage
- **WHEN** the settled accumulated attack reaches the stage target and the player advances
- **THEN** the next phase is the shop, three general offers are present, and one legal edit type is visible

#### Scenario: Player completes the final stage and continues
- **WHEN** the player chooses endless continuation after stage eight
- **THEN** the existing continuation income is awarded and the unified shop is prepared

### Requirement: Generals are acquired through spending
New campaign flow SHALL acquire generals only through the starter choice or paid shop offers and SHALL NOT grant a free post-battle general choice or skip compensation.

#### Scenario: Player buys a general
- **WHEN** the player has enough gold and purchases a valid shop general
- **THEN** the existing price, slot, and replacement rules apply

### Requirement: Revealed edits cost a flat amount
The shop SHALL reveal one legal edit before purchase, charge exactly 8 gold when the player accepts it, and allow the player to choose the edit target using the existing rules.

#### Scenario: Player purchases the revealed edit
- **WHEN** the player has at least 8 gold and accepts the edit offer
- **THEN** 8 gold is deducted and the game opens the target selection for that revealed edit

#### Scenario: Player cannot afford the revealed edit
- **WHEN** the player has fewer than 8 gold
- **THEN** the edit purchase is unavailable and no gold or state is changed

#### Scenario: Player completes the purchased edit
- **WHEN** the player chooses a legal edit target
- **THEN** the edit applies once, the offer is consumed, and the player returns to the same shop

#### Scenario: Player leaves without buying the edit
- **WHEN** the player departs the shop while an edit remains offered
- **THEN** the offer is discarded without granting compensation

### Requirement: In-progress legacy rewards remain completable
The system SHALL continue to load valid saves already in the former recruitment or edit phase and SHALL route them into the unified shop after the current legacy choice completes.

#### Scenario: Legacy recruitment save continues
- **WHEN** a valid save is loaded in the former recruitment phase
- **THEN** its current choice can complete and subsequent rewards use the unified shop

#### Scenario: Legacy edit save continues
- **WHEN** a valid save is loaded with an already revealed edit awaiting a target
- **THEN** the player can complete that edit without an additional purchase and then reaches the shop

