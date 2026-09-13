## 1. Rule settlement

- [x] 1.1 Remove the gamble action, wager calculation, and wager RNG consumption while retaining deterministic full-score banking
- [x] 1.2 Preserve version 8 pending and previously wagered result saves and verify one-time settlement

## 2. Player flow

- [x] 2.1 Automatically bank after animated reveal, skip, reduced motion, and resumed pending results
- [x] 2.2 Replace wager controls and terminology with a read-only settled-result summary and normal continuation
- [x] 2.3 Update rules, strategy helpers, and desktop smoke for the shorter flow

## 3. Verification

- [x] 3.1 Update unit and browser coverage for direct settlement and unchanged Ma Chao pursuit
- [x] 3.2 Run unit, browser, build, packaging, and desktop smoke checks
- [x] 3.3 Validate the OpenSpec change and inspect the resulting 1280 by 720 battle layout
