"""Exact design analysis for the unmodified starting deck, not a game runtime."""
import json
from collections import Counter
from itertools import combinations
from math import comb
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
rules = json.loads((ROOT / 'design-data/rules.v0.1.json').read_text())
deck = [(s, r) for s in rules['deck']['suits'] for r in rules['deck']['ranks']]


def category(hand):
    ranks = sorted(r for _, r in hand)
    unique = len(set(ranks))
    flush = len({s for s, _ in hand}) == 1
    straight = unique == 3 and ranks[-1] - ranks[0] == 2
    if unique == 1:
        return 'three-kind'
    if straight and flush:
        return 'straight-flush'
    if flush:
        return 'flush'
    if straight:
        return 'straight'
    if unique == 2:
        return 'pair'
    return 'high-card'


counts = Counter(category(hand) for hand in combinations(deck, 3))
total = comb(len(deck), 3)
assert sum(counts.values()) == total
lines = [
    '# 基础牌型分布：精确枚举', '',
    f'基础牌库 {len(deck)} 张，三张无序组合共 {total:,} 种。', '',
    '假设每种三张组合等概率；无换阵、改牌、锦囊、军宝或教学脚本。', '',
    '| 牌型 | 组合数 | 自然发牌概率 |', '|---|---:|---:|',
]
for c in reversed(rules['categories']):
    n = counts[c['id']]
    lines.append(f"| {c['name']} | {n:,} | {n / total:.3%} |")
lines += [
    '', '## 设计含义', '',
    '自然抽到豹子或同花顺很少，因此首版不能以频繁出现大牌为乐趣前提。',
    '顺子与同花的发生频率应结合改点数、改兵种的能力一起评估；本表不包含这些操作。',
    '双方独立牌库且规则相同时，未加入行动与被动前具有交换对称性；这不等于征程胜率为 50%。',
    '本报告不验证 AI 退让、加压收益、Boss 难度、锦囊强度或实际游玩时长。', '',
    '复算：在项目目录运行 `python3 tools/analyze_hands.py`。', '',
]
(ROOT / 'docs/HAND_DISTRIBUTION.md').write_text('\n'.join(lines))
print('\n'.join(lines))
