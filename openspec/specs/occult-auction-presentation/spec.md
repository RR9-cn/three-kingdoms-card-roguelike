# occult-auction-presentation Specification

## Purpose
Define the midnight occult-auction presentation while preserving the established game rules.

## Requirements

### Requirement: Playable client presents one occult-auction fantasy
The playable browser and Electron client SHALL present the run as a midnight auction in which the player selects three lots, invites guests, improves a catalog, and reaches escalating hammer-price targets.

#### Scenario: Player opens the game
- **WHEN** the home screen is displayed
- **THEN** its title, premise, primary action, record, and artwork contain no Three Kingdoms army or campaign framing

### Requirement: Public terms replace existing concepts without adding rules
The client SHALL map cards to lots, suits to collectible categories, formation patterns to collection patterns, points to appraised value, multiplier to room heat, final attack to hammer price, gold to cash, discards to lot withdrawal, and additional scoring to renewed bidding.

#### Scenario: Player completes one hand
- **WHEN** three selected lots resolve
- **THEN** the preview, breakdown, revealed steps, total, stage progress, and continuation controls use the auction vocabulary while preserving the same numeric result

### Requirement: Auction escalation uses revealed information only
The client SHALL present the existing settlement sequence as an escalating bidding war and SHALL emphasize the final hammer price without exposing an unrevealed pursuit result or future score step.

#### Scenario: A random renewed bid is pending
- **WHEN** the visible settlement steps end before the saved random result is revealed
- **THEN** the bidding display contains no success, failure, gained price, or later response from that hidden result

### Requirement: Re-theme preserves deterministic compatibility
The re-theme MUST retain stable IDs, save schema, action availability, scoring arithmetic, values, probabilities, stage resources, random streams, and AI request contracts.

#### Scenario: Existing save is loaded
- **WHEN** a valid schema 8 save is opened in the re-themed client
- **THEN** the same run state and legal actions appear with auction-facing labels

