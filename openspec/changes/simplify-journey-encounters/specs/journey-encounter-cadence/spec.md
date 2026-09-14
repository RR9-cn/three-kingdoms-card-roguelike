# Journey Encounter Cadence

## ADDED Requirements

### Requirement: Ordinary journey battles preserve the base rules

Stages 1, 2, 3, 5, 6, and 7 SHALL use the normal scoring and selection rules while increasing their target scores.

#### Scenario: Prior hand state in an ordinary battle

- **WHEN** the player enters an ordinary journey battle after previously playing a particular formation or leading suit
- **THEN** that prior state does not reduce the next hand's score

### Requirement: Bosses contain the campaign rule exceptions

The base eight-stage journey SHALL change scoring or selection behavior only during the Zhang Bao and Zhang Jiao encounters.

#### Scenario: Reaching each boss

- **WHEN** the player reaches stages 4 or 8
- **THEN** the interface presents the boss's public rule and phase behavior

### Requirement: The experiment changes no progression parameters

The stage targets, battle resources, rewards, economy, generals, and scoring formula SHALL remain unchanged.

#### Scenario: Reading the journey targets

- **WHEN** a new journey is created
- **THEN** its targets remain 180, 220, 320, 600, 950, 1350, 1800, and 1900
