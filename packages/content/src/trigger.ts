export const TRIGGER_CARDS = {
 coin: {name:'染血银币',points:6,tag:'藏品',mark:'◈',text:'左侧牌的点数低于自己时，+2热度。'},
 mirror: {name:'裂纹镜',points:2,tag:'工具',mark:'◇',text:'让左侧牌完整触发一次。'},
 hammer: {name:'封印木槌',points:4,tag:'工具',mark:'⊥',text:'每次发动时，已发生的每次额外触发使热度+1。'},
 vase: {name:'鎏金古瓶',points:9,tag:'藏品',mark:'♜',text:'每次触发贡献牌面点数。'},
 candle: {name:'长明烛',points:3,tag:'诡物',mark:'♧',text:'每次触发，+2热度。'},
 bell: {name:'回声铃',points:3,tag:'工具',mark:'♙',text:'左侧牌与自己类别相同时，让左侧牌完整触发一次。'},
 glove: {name:'红手套',points:4,tag:'诡物',mark:'✦',text:'有50%概率让左侧牌完整触发一次。'},
 ledger: {name:'旧账簿',points:4,tag:'藏品',mark:'▤',text:'三张出牌中，每张点数不大于4的牌使热度+1。'},
 mask: {name:'无面假面',points:5,tag:'诡物',mark:'◉',text:'左侧牌与自己类别不同时，+3热度。'},
 prism: {name:'异色棱晶',points:4,tag:'藏品',mark:'△',text:'三张出牌有三种类别时，+4热度。'},
 hourglass: {name:'逆流沙漏',points:2,tag:'工具',mark:'⌛',text:'在第三位触发时，让第一张牌完整触发一次。'},
 crown: {name:'空王冠',points:8,tag:'藏品',mark:'♛',text:'三张出牌的点数均不小于5时，+5热度。'},
} as const;
export type TriggerKind = keyof typeof TRIGGER_CARDS;
export const TRIGGER_KINDS = Object.keys(TRIGGER_CARDS) as TriggerKind[];
export const TRIGGER_TARGETS = [150,260,420] as const;
export const TRIGGER_START: TriggerKind[] = ['vase','vase','coin','coin','candle','candle','mirror','hammer','mask','ledger'];
