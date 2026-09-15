## ADDED Requirements

### Requirement: Animated settlement follows the revealed score boundary
Every animated lot, set, guest, and hammer-price state SHALL be derived only from the currently revealed prefix of the resolved score steps.

#### Scenario: A guest response has not yet been revealed
- **WHEN** settlement has revealed steps before that guest response
- **THEN** the guest is not highlighted and its contribution is not shown in the animated stage

#### Scenario: The final step has been revealed
- **WHEN** settlement reaches the end of the resolved score steps
- **THEN** the animation shows the saved final hammer price and the client banks that exact result once
