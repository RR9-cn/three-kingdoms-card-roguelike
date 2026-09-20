## Why

The playtest UI is a single 6028-byte minified line of CSS with no token layer: 59 colour literals, 54 of them distinct, with colour, radius and spacing hardcoded at each use site. The UI markup is written as template strings inside a 36-line minified `main.ts`. There is therefore no design baseline for the browser UI and no maintainable way to adjust it consistently.

Behavioural accessibility is partly in place already (`focus-visible` with a 3px outline, `aria-live`, `role="alert"`, `prefers-reduced-motion`), but the two overlays carry no dialog semantics, the header toggles expose no expanded state, selected cards expose no pressed state, and the card annotation text renders at 10px with contrast as low as 2.61:1 against the haunted card gradient.

This change gives the browser UI a token layer, makes the overlays and toggles semantically correct and keyboard-operable, and raises card annotation readability — without changing game rules, values, content, save format, animation timing or interaction order.

## What Changes

- Define an `--auction-*` token layer in the `:root` block of `apps/playtest/public/trigger.css`; no colour literal may remain outside `:root`.
- Format the minified stylesheet into readable multi-line form as a separate, format-only commit so that behaviour changes are reviewable.
- Raise the card annotation text from 10px to at least 12px and correct its contrast per card variant to at least 4.5:1.
- Give both overlays `role="dialog"`, `aria-modal="true"` and an accessible name; support closing with Escape; move focus into the dialog on open and return it to the header toggle on close.
- Expose `aria-expanded` on the rules and collection header toggles and `aria-pressed` on the selectable cards.
- Add browser assertions for dialog semantics, Escape closing, focus return, toggle state and pressed state, plus regression assertions for the existing focus, live-region and reduced-motion behaviour.

## Capabilities

### New Capabilities

- `playtest-ui-consistency`: Defines the browser UI token contract, the card annotation readability floor, the dialog and toggle semantics, the keyboard and focus contract for overlays, and the accessibility regression assertions for the midnight-auction playtest UI.

### Modified Capabilities

None.

## Impact

- `apps/playtest/public/trigger.css` gains the token layer and loses all inline colour literals; the visual register, layout and animation timing stay as they are.
- `apps/playtest/src/main.ts` gains semantic attributes and keyboard handling only; render structure, copy, action routing and game flow are unchanged.
- `tests/ui-contract.test.ts` (new) asserts the stylesheet invariants; `tests/browser/trigger.spec.ts` gains dialog, focus, toggle and pressed-state assertions.
- `packages/core`, `packages/content`, the save key `trigger-1`, the AI evaluation contract `schemaVersion 2`, `apps/desktop` and the Vite/Electron build chain are untouched.
- `npm run typecheck`, `npm test` and `npm run test:browser` must remain green.
