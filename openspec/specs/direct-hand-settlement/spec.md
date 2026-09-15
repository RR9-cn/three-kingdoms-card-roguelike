# direct-hand-settlement Specification

## Purpose
Settle each played hand directly and exactly once, without a post-hand wager step.
## Requirements
### Requirement: Hand score settles without a post-battle wager choice
The game SHALL reveal the existing score-step sequence and then add the final hand score to the stage total exactly once without asking the player to bank or wager points.

#### Scenario: Animated settlement completes
- **WHEN** all score steps from a played hand have been revealed
- **THEN** the full final score is added to the stage total and the normal continuation action becomes available

#### Scenario: Player skips settlement animation
- **WHEN** the player skips the remaining score-step animation
- **THEN** all steps are revealed and the full final score is added exactly once

#### Scenario: Reduced motion is enabled
- **WHEN** the system requests reduced motion and the player plays a hand
- **THEN** the complete result is shown and the full final score is added without an intermediate choice

### Requirement: Post-battle wager is absent
The game SHALL NOT offer a separate 20 percent stake, coin flip, win value, or loss value after a hand.

#### Scenario: Hand result is ready
- **WHEN** a hand has finished settling
- **THEN** the interface shows the settled result and continuation action without bank or gamble controls

### Requirement: General pursuit remains unchanged
The game SHALL preserve Ma Chao's existing 35 percent chance to trigger another additional score, bounded to three successful pursuits per hand.

#### Scenario: Build contains Ma Chao and an additional-score source
- **WHEN** an additional score resolves
- **THEN** Ma Chao's pursuit is evaluated by the existing enemy random stream and appears in the score steps and causal chain

### Requirement: Existing result saves remain playable
The game SHALL load version 8 result states created before this change without rerolling or trapping the player.

#### Scenario: Existing pending result is resumed
- **WHEN** a saved result has `settlement: pending`
- **THEN** the existing final score is banked once and the result can continue

#### Scenario: Existing wager result is resumed
- **WHEN** a saved result has `settlement: win` or `settlement: loss`
- **THEN** its previously stored total remains unchanged and the result can continue without wager controls

