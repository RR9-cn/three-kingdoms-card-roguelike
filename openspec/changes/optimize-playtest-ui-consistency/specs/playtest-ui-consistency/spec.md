# playtest-ui-consistency Specification

## Purpose

Give the midnight-auction browser UI a single token layer and correct semantics, so that colour, radius and spacing are adjustable from one place, the overlays and toggles are operable and announceable by keyboard and assistive technology, and card annotations are readable on every card variant.

## Requirements

### Requirement: Playtest colour literals resolve through a single token layer
`apps/playtest/public/trigger.css` MUST define its colour tokens in the `:root` block under the `--auction-*` namespace, MUST NOT contain any colour literal (`#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()`) outside that block, and MUST keep the browser UI in a single stylesheet with no preprocessor or build-time token generation. Token values MUST be the current values; the only permitted value changes are the card annotation contrast corrections named below.

#### Scenario: Token layer is the only colour source
- **WHEN** the playtest stylesheet is inspected
- **THEN** every colour literal appears inside the `:root` block and no rule outside it contains a colour literal

#### Scenario: Palette is unchanged
- **WHEN** a playtest colour token is compared with the value it replaces
- **THEN** the values are identical, except for the card annotation contrast tokens

#### Scenario: Stylesheet stays a single file
- **WHEN** the build inputs are inspected
- **THEN** the browser UI still loads exactly one stylesheet and no preprocessor or token-generation step has been added

### Requirement: The playtest stylesheet is human-readable
The minified stylesheet MUST be reformatted into multi-line, indented CSS in a commit that contains formatting only, with no declaration added, removed or reordered.

#### Scenario: Format-only commit
- **WHEN** the format-only commit is inspected
- **THEN** the diff contains no declaration changes, and `npm test` and `npm run test:browser` pass on that commit

#### Scenario: Readable output
- **WHEN** the stylesheet is opened
- **THEN** it spans multiple lines with one declaration per line

### Requirement: Card annotation text is readable on every card variant
The card annotation text (`.card small`) MUST render at a font size of at least 12px and MUST reach at least 4.5:1 contrast against the darkest end of the gradient of every card variant: normal (`#c6b789`), haunted (`#aa8f91`) and tool (`#92aaa3`). Corrections MUST be minimum colour-step adjustments that preserve hue. Raising the font size alone MUST NOT be treated as satisfying this requirement.

#### Scenario: Font size floor
- **WHEN** the card annotation style is inspected
- **THEN** its font size is at least 12px

#### Scenario: Normal card contrast
- **WHEN** the normal card annotation colour is measured against `#c6b789`
- **THEN** the ratio is at least 4.5:1

#### Scenario: Haunted card contrast
- **WHEN** the haunted card annotation colour is measured against `#aa8f91`
- **THEN** the ratio is at least 4.5:1

#### Scenario: Tool card contrast
- **WHEN** the tool card annotation colour is measured against `#92aaa3`
- **THEN** the ratio is at least 4.5:1

#### Scenario: Raised annotation type does not overflow the card
- **WHEN** a battle hand and the collection overlay are rendered with the raised annotation size
- **THEN** no card content is clipped and the card grid does not overflow

### Requirement: Overlays are exposed as modal dialogs
Each of the two overlays (rules and current-run collection) MUST be exposed with `role="dialog"`, `aria-modal="true"` and an accessible name derived from its own heading. The dialog MUST be labelled by the visible heading it already renders.

#### Scenario: Rules overlay semantics
- **WHEN** the rules overlay is opened
- **THEN** a visible element with `role="dialog"` and `aria-modal="true"` exists and its accessible name is the rules heading

#### Scenario: Collection overlay semantics
- **WHEN** the collection overlay is opened
- **THEN** a visible element with `role="dialog"` and `aria-modal="true"` exists and its accessible name is the collection heading

### Requirement: Overlays are keyboard-operable and restore focus
While a dialog is open, pressing Escape MUST close it. Focus MUST move into the dialog when it opens and MUST return to the header toggle that opened it when it closes. Closing MUST NOT change the game state, the selected order, or the rendered copy.

#### Scenario: Escape closes the rules dialog
- **WHEN** the rules dialog is open and the user presses Escape
- **THEN** the dialog closes and the header rules toggle receives focus

#### Scenario: Escape closes the collection dialog
- **WHEN** the collection dialog is open and the user presses Escape
- **THEN** the dialog closes and the header collection toggle receives focus

#### Scenario: Focus returns to the toggle, not the in-dialog close button
- **WHEN** a dialog opened from a header toggle is closed by any means
- **THEN** focus lands on that header toggle and not on the dialog's own close button

#### Scenario: Closing does not mutate game state
- **WHEN** a dialog is opened and closed during a battle
- **THEN** the selected order, the hand, the score and the save payload are unchanged

### Requirement: Toggle and selection state is exposed to assistive technology
The rules and collection header toggles MUST expose `aria-expanded` reflecting their open state, and each selectable card MUST expose `aria-pressed` reflecting whether it is currently part of the selected order. Colour MUST NOT be the only signal of either state.

#### Scenario: Header toggle state follows the dialog
- **WHEN** a header toggle is activated and the corresponding dialog opens or closes
- **THEN** that toggle's `aria-expanded` changes between `true` and `false` accordingly

#### Scenario: Card pressed state follows the selection order
- **WHEN** a card is picked into the order, removed, or cleared
- **THEN** that card's `aria-pressed` reflects its membership in the order

### Requirement: Existing playtest accessibility behaviour is preserved and protected
The existing `:focus-visible` outline, the `aria-live` region, the `role="alert"` error surface and the `prefers-reduced-motion` handling MUST remain in effect, and MUST gain regression assertions.

#### Scenario: Focus outline remains
- **WHEN** a control is focused by keyboard
- **THEN** the existing visible outline is still rendered

#### Scenario: Error surface remains a live alert
- **WHEN** a malformed save is loaded
- **THEN** a `role="alert"` message is visible and the home screen remains operable

#### Scenario: Reduced motion remains honoured
- **WHEN** the reduced-motion preference is active and a settlement is produced
- **THEN** the settlement steps are presented without the staged animation

### Requirement: The playtest UI keeps its behaviour and contracts
The change MUST NOT alter game rules, values, card content, random behaviour, the save key `trigger-1`, the AI evaluation contract `schemaVersion 2`, interaction order or user-visible copy.

#### Scenario: Rules kernel untouched
- **WHEN** the change is inspected
- **THEN** `packages/core` and `packages/content` are unmodified and `trigger-1` and `schemaVersion 2` are unchanged

#### Scenario: Copy and order unchanged
- **WHEN** the UI is compared with the previous revision
- **THEN** no user-visible copy and no interaction step has been added, removed or reordered

### Requirement: Existing playtest verification stays green
The change MUST NOT regress the existing verification channels.

#### Scenario: Unit and type checks pass
- **WHEN** `npm run typecheck` and `npm test` are executed
- **THEN** type checking passes and all pre-existing unit cases pass

#### Scenario: Browser checks pass
- **WHEN** `npm run test:browser` is executed
- **THEN** the pre-existing end-to-end cases and the new dialog, focus, toggle and pressed-state assertions pass

#### Scenario: Narrow viewport fits
- **WHEN** the UI is rendered at the 700px narrow desktop width
- **THEN** the document scroll width does not exceed the viewport width
