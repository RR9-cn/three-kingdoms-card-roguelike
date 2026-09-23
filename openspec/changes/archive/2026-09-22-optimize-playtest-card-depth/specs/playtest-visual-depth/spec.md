## ADDED Requirements


### Requirement: Card surfaces present layered material under one light direction

Every card surface in the playtest client SHALL render as a layered material — a face layer carrying a paper, frosted or metal-edge treatment plus a shadow layer — lit from one consistent direction, and SHALL NOT rely on a single flat drop shadow. The card variants (normal collectible, haunted, tool) SHALL differ in at least one non-hue material property in addition to colour. Material and highlight layers MUST sit behind the card text.

#### Scenario: A card renders layered material

- **WHEN** a card is rendered in the hand, the played area, the reward choice, an upgrade or collection grid, or the home example
- **THEN** its computed style declares a material layer (texture or edge treatment) and at least two shadow layers whose vertical offsets share one light direction

#### Scenario: Variants are distinguishable without hue alone

- **WHEN** a normal, a haunted and a tool card are compared
- **THEN** their edge treatment, texture intensity or shadow depth differ from each other, so the variants remain distinguishable without colour perception

#### Scenario: Card text stays readable

- **WHEN** any card variant is rendered
- **THEN** the point value, category tag, name, ability text and upgrade annotation are not covered by a material or highlight layer and keep their existing font size and colour

### Requirement: Cards present CSS-3D depth and pointer-following tilt on fine pointers

Card containers SHALL present CSS-3D depth using `perspective`, `transform-style: preserve-3d` and a non-zero `translateZ` layer for the face and the shadow, and SHALL NOT require an added wrapper element. On a fine pointer, moving the pointer across an interactive card SHALL tilt that card by setting `rotateX` and `rotateY` from the pointer position within a bounded angle, and moving the pointer out SHALL return the card to its resting transform within 200ms. Tilt MUST NOT move any other card and MUST NOT introduce horizontal overflow.

#### Scenario: Depth is declared on the card itself

- **WHEN** an interactive card is inspected
- **THEN** it declares `perspective`, `transform-style: preserve-3d` and a `translateZ` offset that separates the face from the shadow

#### Scenario: Tilt follows the pointer

- **WHEN** the pointer moves across an interactive card on a fine pointer
- **THEN** that card's `rotateX` and `rotateY` change with the pointer position, stay within the configured bounds, and its highlight and shadow offsets shift with the same angle

#### Scenario: Pointer exit returns to rest

- **WHEN** the pointer leaves the card
- **THEN** the card reaches its resting transform within 200ms

#### Scenario: One card tilts without moving its neighbours

- **WHEN** any card is tilted
- **THEN** every other card keeps its position and the hand grid does not reflow

#### Scenario: Bounded tilt does not overflow

- **WHEN** the hand is rendered and tilted at the 1000×700, 1280×800 and 1440×900 viewports
- **THEN** the document scroll width does not exceed the viewport width and no card's point value, tag, name, ability text or upgrade annotation is covered

### Requirement: Selection lifts a card and keeps its slot order legible

A selected card SHALL be raised along the Z axis with a strengthened shadow, and its existing "第 N 位" annotation and the matching `01`/`02`/`03` slot SHALL remain the order signal. Up to three selected cards SHALL be simultaneously identifiable and their order SHALL stay legible. Clearing the selection or removing a card SHALL restore its resting transform and shadow exactly.

#### Scenario: Selected card is raised

- **WHEN** a card is picked into the order
- **THEN** its transform includes a positive `translateZ` and its shadow is stronger than in the resting state

#### Scenario: Three selections stay ordered

- **WHEN** three cards are selected
- **THEN** each selected card still shows its position annotation and the slot with the same index shows the same card

#### Scenario: Deselection restores the resting state

- **WHEN** the selection is cleared, or a selected card is removed or moved out of the order
- **THEN** that card returns to exactly its resting transform and shadow

#### Scenario: No new selection copy

- **WHEN** the battle screen is compared with the previous revision
- **THEN** no user-visible copy, control or interaction step has been added, removed or reordered

### Requirement: Settlement uses a step-bound hammer-fall transition

During settlement the client SHALL present a hammer-fall 3D transition on the card of the currently revealed step only, keeping the whole face upright and readable, and SHALL NOT flip the card, hide its text or introduce a card back. Activating the existing skip control SHALL reach the final state immediately. A repeated settlement, a consecutive round and any re-render during settlement MUST NOT replay or retain a previous transition state.

#### Scenario: Only the revealed step's card transitions

- **WHEN** settlement has revealed steps up to index N
- **THEN** only the card of the step at index N carries the transition, already revealed cards are static, and not-yet-revealed steps show no effect

#### Scenario: Face stays readable throughout

- **WHEN** the transition plays
- **THEN** the card's point value, name, ability text and annotation stay upright and readable, and no card back or hidden face appears

#### Scenario: Skip is immediately terminal

- **WHEN** the skip control is activated during settlement
- **THEN** the complete settlement and the final hammer price appear immediately with no transition, and the banked score is unchanged

#### Scenario: No residual animation state

- **WHEN** a second settlement is produced, a consecutive round is rendered, or a re-render happens during settlement
- **THEN** no transition marker, animation or inline variable from the previous settlement remains on any card

#### Scenario: Reduced motion settles statically

- **WHEN** the reduced-motion preference is active and a settlement is produced
- **THEN** the complete settlement and final hammer price appear immediately, as they do today

### Requirement: Depth presentation degrades without losing information or control

The client SHALL apply no pointer tilt and no 3D transition when the operating system requests reduced motion, and SHALL keep the game fully operable and informative when hover or the pointer API is unavailable. Degradation MUST NOT remove information, controls or keyboard reachability.

#### Scenario: Reduced motion disables tilt and transitions

- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** no card carries a pointer-driven tilt, no 3D transition plays, and every card still shows its full information

#### Scenario: Coarse pointer or no hover

- **WHEN** `hover: hover` or `pointer: fine` does not match
- **THEN** no tilt is applied and selecting, ordering, settling and skipping remain fully operable

#### Scenario: Pointer hook absent or failing

- **WHEN** the pointer hook does not run
- **THEN** the static layered presentation and every interaction still work

### Requirement: New visual values live in the `:root` token layer

Every colour, gradient, shadow and texture value introduced by this change MUST be declared as a custom property in the `:root` block of `apps/playtest/public/trigger.css` and MUST NOT appear as a colour literal (`#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()`) outside it. An introduced texture MUST be an inline `data:` URI held in a token, MUST NOT be an external file, and MUST be written so it introduces no `rgb()`/`rgba()`/`hsl()`/`hsla()` text form. Existing card gradient endpoint colours, card text colours and the `.card small` font size MUST NOT be changed by this change.

#### Scenario: Tokens are the only source of the new values

- **WHEN** the stylesheet is inspected after this change
- **THEN** every value this change introduces appears in the `:root` block and no colour literal has been added outside it

#### Scenario: No external asset is introduced

- **WHEN** the built assets and the stylesheet are inspected
- **THEN** no new image, font or other external file has been added, and any texture is an inline `data:` URI

#### Scenario: Existing card colours and annotation size are preserved

- **WHEN** the card variants are compared with the previous revision
- **THEN** the gradient endpoint colours, the text colours and the `.card small` font size are unchanged

### Requirement: The presentation change keeps every existing contract

This change MUST NOT alter game rules, values, card content, random behaviour, the save protocol `trigger-1`, the save key `midnight-hammer:trigger-1`, action routing, user-visible copy, the `aria-label` contract or the interaction order. It MUST NOT add a runtime dependency, an external network resource or an HTML inline `style` attribute. It MUST keep the existing keyboard, focus and live-region behaviour, and it MUST keep the existing verification channels green, updating any assertion or screenshot it legitimately affects.

#### Scenario: Kernel and save are untouched

- **WHEN** the change is inspected
- **THEN** `packages/core/src/trigger.ts` and `packages/content/src/trigger.ts` are unmodified and the save protocol and key are unchanged

#### Scenario: CSP and resource contract hold

- **WHEN** the page is loaded under the existing `index.html` CSP
- **THEN** no inline `style` attribute is used, no new external request is made, and `style-src 'self'` and `img-src 'self' data:` remain sufficient

#### Scenario: Keyboard and accessibility behaviour hold

- **WHEN** the battle screen is operated by keyboard
- **THEN** Tab reaches every card and slot control, the `focus-visible` outline is visible, the `aria-label` values `<卡名>左移`, `<卡名>右移` and `移除` are unchanged, and the transformed cards keep their visible click and focus areas aligned with the pointer hit area

#### Scenario: Existing layout and DOM contracts hold

- **WHEN** the rendered battle screen is inspected
- **THEN** `.hand` is still `display: grid`, `.hand .card` still renders six clickable buttons carrying `data-action`, `data-id`, `data-kind` and `data-bonus`, played cards still carry `tabindex="-1"`, and the log still renders in its `aria-live` region

#### Scenario: Verification stays green

- **WHEN** `npm ci`, `npm run build`, `npm test` and `npm run test:browser` are executed
- **THEN** they pass, and any assertion or evidence screenshot that the change legitimately affects is updated in the same change with its reason recorded
