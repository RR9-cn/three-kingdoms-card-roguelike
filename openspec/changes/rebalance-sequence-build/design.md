## Context

策展人 starts three additional bids from a same-category hand. 编目师 currently starts only one from a sequence, despite sequence being harder to assemble. Generic responders then compound the stronger opener. The evaluator also maps unknown opening guests to the old 老鉴定师 preference list, which biases random-opening evidence.

## Goals / Non-Goals

**Goals:**
- Give sequence builds a complete existing-rule opener.
- Measure whether sequence wins can occur without 策展人.
- Let all active random openings choose purchases from a relevant route rather than an obsolete fallback.

**Non-Goals:**
- Guaranteeing equal win rates for every guest.
- Adding a new resource, keyword, guest, encounter, or reward choice.
- Changing the same-category build in the same experiment.

## Decisions

- 编目师 adds one existing additional-bid source to every card when the hand is either 年代序列 or 连号专场. This changes only the number of existing triggers from one to three.
- A temporary `zhaoyunMode` evaluation override retains the former one-card behavior for paired comparisons; live rules default to all three.
- Evaluation concentration reports record 编目师 presence and victories without 策展人. Purchase preferences use the current opening guest's mechanic family for all 16 active guests.

## Risks / Trade-offs

- [编目师 and 策展人 can stack on 连号专场] → Report their co-occurrence separately; do not weaken either in this change.
- [Three triggers may overshoot early targets] → Compare identical seeds and inspect stage-level changes before touching targets.
- [Automated policy remains heuristic] → Treat it as regression evidence rather than human balance truth.
