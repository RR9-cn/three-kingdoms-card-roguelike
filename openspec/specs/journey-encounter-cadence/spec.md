# journey-encounter-cadence Specification

## Purpose
Keep ordinary auction stages as score checks and concentrate rule exceptions in two signature-buyer encounters.

## Requirements
### Requirement: Ordinary journey battles preserve the base rules
Stages 1, 2, 3, 5, 6, and 7 SHALL use the normal scoring and selection rules while increasing their hammer-price targets.

#### Scenario: Prior selection state in an ordinary auction
- **WHEN** the player enters an ordinary stage after previously playing a particular collection pattern or leading category
- **THEN** that prior state does not reduce the next selection's hammer price

### Requirement: Bosses contain the campaign rule exceptions
The base eight-stage auction SHALL change scoring or selection behavior only during the Masked Broker and Final Collector encounters.

#### Scenario: Reaching each signature buyer
- **WHEN** the player reaches stages 4 or 8
- **THEN** the interface presents the buyer's public preference and phase behavior using auction terminology

### Requirement: The experiment changes no progression parameters
The stage targets, auction resources, rewards, economy, guests, and scoring formula SHALL remain unchanged.

#### Scenario: Reading the journey targets
- **WHEN** a new auction is created
- **THEN** its targets remain 180, 220, 320, 600, 950, 1350, 1800, and 1900
