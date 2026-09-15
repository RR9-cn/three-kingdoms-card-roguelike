## Why

The current Three Kingdoms presentation makes the game look like a familiar historical card battler before players can notice its distinctive three-card scoring and freeform trigger chains. The playable prototype now needs a visually coherent Steam-facing identity that gives high scores a concrete fantasy: turning a small appraisal into an absurd auction price.

## What Changes

- Replace current player-facing Three Kingdoms, army, campaign, and battle terminology with a midnight occult-auction setting.
- Present the six-card choice as selecting three relic lots, permanent build characters as invited specialists and collectors, additional scoring as renewed bidding, and stage targets as auction revenue.
- Re-theme the two existing bosses as signature buyers with the same phase rules, thresholds, penalties, and random behavior.
- Restyle the shared browser and Electron interface around an Art Deco auction room with black, oxblood, brass, paper, bid paddles, lot labels, and a prominent final hammer price.
- Add a compact bidding escalation treatment to the existing settlement sequence without predicting hidden pursuit or changing timing semantics.
- Preserve stable IDs, save schema, rules, values, probabilities, action count, stage count, shop flow, AI interfaces, and random streams.

## Capabilities

### New Capabilities
- `occult-auction-presentation`: Defines the public theme, terminology, visual hierarchy, and bidding-chain presentation for the playable client.

### Modified Capabilities
- `general-only-roster`: Permanent build characters are presented as auction guests and specialists rather than Three Kingdoms generals.
- `simple-scoring`: The existing points-times-multiplier formula receives auction-facing labels while retaining identical arithmetic.
- `journey-encounter-cadence`: The eight stages and two bosses receive auction identities while retaining their existing cadence and mechanics.
- `point-breakdown`: The breakdown uses appraisal, restoration, renewed bids, and specialist contributions as presentation labels.
- `unified-post-battle-shop`: The post-stage shop sells guest invitations and restoration work using cash terminology.
- `targeted-random-edit`: Existing edit actions receive auction restoration and cataloguing labels.
- `combo-readability`: Existing causal roles are expressed as opening bids, renewed bids, and bidder responses.
- `discovery-preserving-feedback`: Ordinary sales and bidding wars replace ordinary and linkage settlement labels.
- `settlement-causality`: The central chain presents the revealed bidding escalation using auction characters and lots.

## Impact

The change affects shared content copy, browser rendering, CSS, boss presentation, documentation, browser assertions, screenshots, and packaged desktop output. Core calculations and serialized identifiers remain compatible. Existing uncommitted OpenSpec archive and outreach documentation work remains in place.
