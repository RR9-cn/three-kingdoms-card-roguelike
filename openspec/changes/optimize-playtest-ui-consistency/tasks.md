## 1. Format-only baseline

- [ ] 1.1 Reformat `apps/playtest/public/trigger.css` from one minified line into multi-line indented CSS, changing no declaration, and commit it alone.
- [ ] 1.2 Confirm `npm test` and `npm run test:browser` pass on the format-only commit.

## 2. Token layer

- [ ] 2.1 Define the `--auction-*` colour token block in `:root`, covering the page field, glow, surfaces, dividers, control borders, text, gold accents, the overlay scrim, and the three card variants.
- [ ] 2.2 Replace every colour literal outside `:root` with a token reference; confirm zero colour literals remain outside the block.
- [ ] 2.3 Keep the single-stylesheet, no-preprocessor constraint and confirm no build input changed.

## 3. Card annotation readability

- [ ] 3.1 Raise `.card small` from 10px to at least 12px.
- [ ] 3.2 Add per-variant annotation tokens set to the minimum darkening of `#4c5549` that reaches 4.5:1 on each variant's darkest gradient end: normal `#434b41`, haunted `#2b302a`, tool `#373d35`.
- [ ] 3.3 Confirm no card content is clipped and the hand grid does not overflow at the default and 700px widths.

## 4. Dialog semantics and keyboard

- [ ] 4.1 Add `role="dialog"`, `aria-modal="true"` and `aria-labelledby` (pointing at the existing visible heading) to the rules and collection overlays.
- [ ] 4.2 Give the header toggles a distinct handle from the in-dialog close buttons so focus can be returned to the toggle rather than the close button.
- [ ] 4.3 Move focus into the dialog on open and return it to the opening header toggle on close.
- [ ] 4.4 Close the open dialog on Escape without changing game state, selected order or copy.
- [ ] 4.5 Add `aria-expanded` to the header toggles and `aria-pressed` to the selectable cards, driven by the existing state.
- [ ] 4.6 Confirm no interaction step, action routing or user-visible copy changed.

## 5. Verification

- [ ] 5.1 Add `tests/ui-contract.test.ts` asserting: no colour literal outside `:root`, the card annotation font-size floor, and the per-variant contrast ratios computed from the stylesheet values.
- [ ] 5.2 Extend `tests/browser/trigger.spec.ts` with: rules and collection dialog semantics, Escape closing, focus return to the opening toggle, `aria-expanded` transitions, and `aria-pressed` transitions.
- [ ] 5.3 Add regression assertions for the existing focus outline, the `role="alert"` error surface, and reduced-motion settlement presentation.
- [ ] 5.4 Run `npm ci`, `npm run typecheck`, `npm test` and `npm run test:browser`; all must pass. If Chrome is unavailable for `test:browser`, record the missing verification and its impact instead of claiming it passed.
- [ ] 5.5 Capture before/after screenshots of the home screen, battle, settlement, reward and both dialogs under `docs/evidence/`.
