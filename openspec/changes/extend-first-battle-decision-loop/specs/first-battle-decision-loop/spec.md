## ADDED Requirements

### Requirement: First battle exposes consecutive hand decisions
The first campaign stage SHALL require 180 accumulated attack while retaining four plays, two base discards, and the existing retain-and-refill behavior.

#### Scenario: A common starter burst scores below 180
- **WHEN** the player's first hand scores less than 180 attack
- **THEN** the battle continues with unplayed cards retained and the hand refilled under the existing rules

#### Scenario: The player reaches 180 attack
- **WHEN** accumulated attack reaches or exceeds 180 within the available plays
- **THEN** the first stage is won under the standard victory flow

### Requirement: First-stage tuning remains isolated
The target adjustment SHALL NOT change general abilities, later stage targets, rewards, random consumption, save shape, or available actions.

#### Scenario: The campaign advances beyond stage one
- **WHEN** the player completes the first stage
- **THEN** all later stages and reward phases use their existing rules and values
