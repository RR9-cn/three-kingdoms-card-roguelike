## ADDED Requirements

### Requirement: Combination discovery remains with the player
The game SHALL show each general's individual ability text where the player makes a recruitment or formation choice, and SHALL NOT display prescribed general combinations or linkage recommendations before play.

#### Scenario: Player reviews a general choice
- **WHEN** the player views a starter, recruitment, shop, or pre-battle general choice
- **THEN** the interface shows the general's own ability without a suggested partner or combination recipe

#### Scenario: Player enters the fixed battle demo
- **WHEN** the player views the independent battle demo
- **THEN** the interface identifies it as a temporary demo without instructing a named general linkage sequence

### Requirement: Settlement distinguishes ordinary scoring from linkage scoring
The game SHALL label a resolved hand without any additional-score card as “普通结算” and SHALL reserve linkage settlement labels and tiers for hands containing at least one additional-score card.

#### Scenario: Hand has no additional scoring
- **WHEN** a played hand resolves without an `额外计分牌` step
- **THEN** the result is labeled “普通结算” and no Ma Chao linkage tier is shown

#### Scenario: Hand has additional scoring
- **WHEN** a played hand resolves with at least one `额外计分牌` step
- **THEN** the result is labeled as a linkage settlement and its post-result causal explanation remains available

### Requirement: Successful Ma Chao pursuit reveals its exact gain
The game SHALL keep the deterministic score as the pre-play guaranteed preview and, after at least one successful Ma Chao pursuit, SHALL display the exact increase from the guaranteed preview to the final offensive score.

#### Scenario: Ma Chao pursuit succeeds
- **WHEN** a hand with additional scoring resolves with one or more successful Ma Chao pursuits
- **THEN** the interface states that Ma Chao pursuit succeeded and displays `final score - guaranteed preview` as the attack gained by this linkage

#### Scenario: Ma Chao pursuit does not succeed
- **WHEN** the player previews a hand or its Ma Chao pursuit resolves without success
- **THEN** the interface does not show an estimated score range or claim an attack gain
