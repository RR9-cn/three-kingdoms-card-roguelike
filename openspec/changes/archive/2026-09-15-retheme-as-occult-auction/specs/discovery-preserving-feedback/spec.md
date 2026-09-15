## MODIFIED Requirements

### Requirement: Combination discovery remains with the player
The game SHALL show each guest's individual ability text where the player makes an opening, market, or pre-auction choice, and SHALL NOT display prescribed guest combinations before settlement.

#### Scenario: Player reviews a guest choice
- **WHEN** the player views an opening guest, invitation, backstage offer, or pre-auction guest list
- **THEN** the interface shows the guest's own ability without a suggested partner or combination recipe

#### Scenario: Player enters the fixed settlement demo
- **WHEN** the player views the independent settlement demo
- **THEN** the interface identifies it as a temporary demo without instructing a named guest sequence

### Requirement: Settlement distinguishes ordinary scoring from linkage scoring
The game SHALL label a resolved selection without any renewed bid as “普通成交” and SHALL reserve bidding-war labels and tiers for selections containing at least one renewed bid.

#### Scenario: Selection has no renewed bid
- **WHEN** three lots resolve without an `追加竞价拍品` step
- **THEN** the result is labeled “普通成交” and no bidding-war tier is shown

#### Scenario: Selection has renewed bidding
- **WHEN** three lots resolve with at least one `追加竞价拍品` step
- **THEN** the result is labeled as a bidding war and its post-result causal explanation remains available

### Requirement: Successful Ma Chao pursuit reveals its exact gain
The game SHALL keep the deterministic hammer price as the pre-selection guaranteed preview and, after at least one successful random renewed bid, SHALL display the exact increase from the guaranteed preview to the final hammer price.

#### Scenario: Random renewed bid succeeds
- **WHEN** a selection with renewed bidding resolves with one or more successful random follow-ups
- **THEN** the interface names the responsible guest and displays `final hammer price - guaranteed preview` as the price gained by the bidding war

#### Scenario: Random renewed bid does not succeed
- **WHEN** the player previews a selection or its random follow-up resolves without success
- **THEN** the interface does not show an estimated price range or claim a price gain

