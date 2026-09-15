## Context

The v0.7 client renders most presentation from shared content constants and a single TypeScript view, while the rules engine stores stable English IDs for suits, generals, stages, actions, and saves. This separation allows a complete public re-theme without altering deterministic mechanics. The repository currently also contains uncommitted OpenSpec archival and IndieNova planning work, which this change must preserve.

## Goals / Non-Goals

**Goals:**

- Make the first screen immediately communicate a midnight auction fantasy and the repeated decision of choosing three lots from six.
- Give points, multiplier, additional scoring, pursuit, stage targets, edits, and bosses coherent auction meanings.
- Make settlement feel like escalating bids culminating in a hammer price, using DOM and CSS that work in both Vite and Electron.
- Keep every existing action and outcome recognizable enough that current browser coverage can be updated rather than replaced.

**Non-Goals:**

- Change scoring, balance, random consumption, stage resources, shop prices, save schema, or AI-visible stable IDs.
- Add bidding controls, a new resource, a new phase, inventory management, narrative events, or metaprogression.
- Produce a final production asset library or claim Windows-native verification.

## Decisions

### Stable mechanics, replaced public vocabulary

Internal suit IDs remain `spear`, `cavalry`, `bow`, and `scheme`, while the client and shared content present them as 器物、画作、典籍、诡物. Existing permanent-character IDs remain unchanged, but their names and descriptions become auction guests such as 红手套、策展人 and 黑纱夫人. This preserves saves and deterministic tests while preventing Three Kingdoms language from leaking into the playable UI.

### One coherent auction metaphor

Cards are lots, base points are appraised value, multiplier is room heat, final attack is hammer price, additional scoring is another bid, discarding is withdrawing lots, and gold is cash. Formations become collection patterns. These are replacements for existing terms rather than additional concepts.

### CSS-first vertical slice

The first implementation uses geometric Art Deco framing, bid paddles, catalog typography, paper cards, oxblood panels, brass highlights, and animated bid escalation in HTML/CSS. The Zhao Yun image and Zhang Jiao sprite sheet are removed from active presentation because retaining historical characters would undermine the theme. Purpose-built raster characters can follow only after the playable direction is reviewed.

### Boss mechanics keep their identity through buyers

Zhang Bao becomes the masked broker, whose opening suppression is removed by withdrawing lots. Zhang Jiao becomes the final collector, whose second phase demands an occult lot. Thresholds and penalties remain identical, including hidden random boundaries.

### Compatibility stays at stable-ID level

Existing saves continue to load because IDs and schema remain fixed. Persisted scores, actions, and random states are not migrated. Generated screenshots and text assertions are updated to the new vocabulary.

## Risks / Trade-offs

- [A complete wording replacement can obscure familiar poker patterns] → Keep concise formation conditions and numeric examples beside the new names.
- [CSS-only characters can feel temporary] → Treat this as a visual-direction slice and make its silhouettes intentional; defer bulk asset generation until review.
- [Old terminology may survive in secondary screens] → Search all player-facing sources and browser output for the retired vocabulary before completion.
- [Documentation and AI interfaces can drift] → Update current product documents while retaining stable IDs and explicitly document the presentation mapping.

## Migration Plan

Ship the new presentation through the shared Vite client, rebuild Electron output, and load an existing v8 save to confirm compatibility. Rollback restores shared content labels and client styles without touching saved state.

## Open Questions

The final product title and bespoke character art style remain open until the CSS-first playable slice is reviewed.
