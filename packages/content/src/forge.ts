/** v0.8 auction presentation: all effects are implemented by the core, never executable text. */
export const FORGE_VERSION='0.7.0';
export const FORGE_RULES={hands:4,discards:2,handSize:6,slots:5,startGold:12,minDeck:12,maxDeck:60,baseMult:[1,2,3,4,6,10],levelMult:1,refreshBase:3,editCost:8,pressureReward:8,pressureFactor:1.5} as const;
export const COMPANIONS={
 pursuit:{name:'红手套',mark:'红',role:'追价',price:12,text:'每次追加竞价后，35%概率让该拍品再次竞价；每轮最多成功3次。',hint:'任何追加竞价都可能让红手套再次举牌。',effect:'burst-repeat'},
 chain:{name:'抬价人',mark:'价',role:'响应',price:16,text:'每次拍品追加竞价后，+3热度。',hint:'不区分是谁开价；每次真实追加都会抬高全场热度。',effect:'burst-mult'},
 guanyu:{name:'老鉴定师',mark:'鉴',role:'成长',price:10,text:'出现成对藏品或本轮发生追加竞价，永久 +1 热度；每轮一次。',hint:'既能研究成对藏品，也能加入任何竞价链。',effect:'pair-growth'},
 zhangfei:{name:'双生客',mark:'双',role:'开价',price:12,text:'含成对藏品时，第一件成对拍品追加竞价一次。',hint:'让该拍品的修复与逐件贵宾效果再次发动。',effect:'pair-repeat'},
 liubei:{name:'淘金客',mark:'淘',role:'响应',price:10,text:'每当估值不大于4的拍品计价，+5热度。',hint:'追加竞价时也发动，专门把便宜货炒成天价。',effect:'low-card'},
 zhouyu:{name:'策展人',mark:'展',role:'开价',price:10,text:'三件拍品同类别时，它们各追加竞价一次。',hint:'主动凑成主题专场，一次带起三轮竞价。',effect:'two-suit'},
 zhaoyun:{name:'编目师',mark:'目',role:'开价',price:10,text:'组成年代序列或连号专场时，最低价拍品追加竞价一次。',hint:'让序列里不起眼的拍品成为竞价入口。',effect:'straight-growth'},
 huangzhong:{name:'金眼',mark:'金',role:'逐件',price:9,text:'每件估值不小于7的拍品计价时，+18估值。',hint:'修复、复制和追加竞价都会放大高价拍品。',effect:'high-chips'},
 zhugeliang:{name:'落槌人',mark:'槌',role:'开价',price:14,text:'最右侧拍品追加竞价一次。',hint:'不要求组合，任何一件拍品都能成为压轴。',effect:'last-repeat'},
 caocao:{name:'清仓商',mark:'清',role:'现金',price:8,text:'每次撤换拍品获得2现金。',hint:'把不合适的拍品撤下，也能补充后台资金。',effect:'discard-gold'},
 sunquan:{name:'异域商',mark:'异',role:'混搭',price:9,text:'本轮包含三种不同类别，+4热度。',hint:'保留不同类别，经营混合收藏。',effect:'mixed-suits'},
 lvbu:{name:'黑金侯',mark:'侯',role:'爆发',price:12,text:'组成传世三件套，当前热度 ×3。',hint:'复制相同估值，提高三件套出现频率。',effect:'triple-mult'},
 diaochan:{name:'黑纱夫人',mark:'纱',role:'响应',price:10,text:'每当诡物计价，+2热度。',hint:'诡物追加竞价时也会再次发动。',effect:'scheme-mult'},
 simayi:{name:'守夜人',mark:'夜',role:'压轴',price:10,text:'本场最后一次上拍，当前热度 ×2。',hint:'可以保底，也可以为最后一轮蓄势。',effect:'last-hand'},
 blade:{name:'估价师',mark:'估',role:'逐件',price:11,text:'每件估值不小于7的拍品计价时，+2热度。',hint:'同一件拍品追加竞价时会再次获得热度。',effect:'high-mult'},
 drum:{name:'跑堂',mark:'堂',role:'基础',price:7,text:'本轮含成对藏品，+30估值。',hint:'提供前期成交额，之后再考虑是否腾出席位。',effect:'pair-chips'},
 horse:{name:'夜班信使',mark:'信',role:'撤换',price:8,text:'每场撤换拍品次数 +1。',hint:'增加寻找组合与清仓回款的机会。',effect:'extra-discard'},
 scroll:{name:'修复师',mark:'修',role:'规则',price:12,text:'三个不同估值，排序后相邻间隔至多2，也可组成年代序列。',hint:'例如1、3、5；同类别则组成连号专场。',effect:'gap-straight'},
 seal:{name:'庄家',mark:'庄',role:'加场',price:9,text:'选择加码专场时，当前热度 ×1.25。',hint:'目标增加50%，成功后额外获得8现金。',effect:'pressure-mult'},
 granary:{name:'账房先生',mark:'账',role:'现金',price:9,text:'每持有5现金，+1热度，上限 +8。',hint:'现在花钱补强，还是留住现金抬高热度？',effect:'wealth-mult'},
 abacus:{name:'库房管家',mark:'库',role:'精简',price:8,text:'库房少于36件时，每少一件，+6估值。',hint:'撤拍既改善抽取稳定性，也提高成交价。',effect:'thin-deck'},
 oath:{name:'大收藏家',mark:'藏',role:'爆发',price:12,text:'主题专场：三件拍品同类别，当前热度 ×1.8。',hint:'专门放大已经成形的主题收藏。',effect:'flush-mult'},
} as const;
export type CompanionId=keyof typeof COMPANIONS;
export const ALL_COMPANION_IDS=Object.keys(COMPANIONS) as CompanionId[];
/** New runs only: twelve freely combinable guests. Other stable IDs remain loadable for v8 saves. */
export const COMPANION_IDS:CompanionId[]=['guanyu','zhangfei','pursuit','chain','liubei','zhugeliang','caocao','abacus','zhouyu','diaochan','oath','zhaoyun'];
export const STARTERS:CompanionId[]=['guanyu','zhouyu','liubei'];
export const STAGES=[
 {name:'开门试拍',enemy:'零散来客',target:180,rule:'none',text:'四轮上拍内完成今晚第一笔成交额。'},
 {name:'名流入席',enemy:'挑剔买家',target:220,rule:'none',text:'拍品组合、贵宾与目录调整开始显现价值。'},
 {name:'黄金席位',enemy:'老练藏家',target:320,rule:'none',text:'成交目标继续提高，检验当前收藏能否稳定抬价。'},
 {name:'假面专场',enemy:'假面掮客',target:600,rule:'ambush',text:'签名买家：前40%预算保持冷场，撤换拍品可解除本轮压价；之后连续相同组合的成交价减半。'},
 {name:'午夜钟响',enemy:'深夜名流',target:950,rule:'none',text:'更高成交目标检验成长与热度的积累。'},
 {name:'密室开门',enemy:'禁品藏家',target:1350,rule:'none',text:'中场检验：用已经形成的贵宾组合跨过更高成交额。'},
 {name:'落槌前夜',enemy:'包厢贵宾',target:1800,rule:'none',text:'终场前的收藏检验，不改变你的上拍规则。'},
 {name:'最后一槌',enemy:'终局收藏家',target:1900,rule:'last-stand',text:'最后的买家只给3轮机会。满足40%预算后提出契约：本轮未包含诡物，成交价×0.6。'},
] as const;
export type ForgeEdit='remove'|'copy'|'rank'|'enhance'|'suit'|'level';
export const EDITS:Record<ForgeEdit,{name:string;text:string}>={remove:{name:'撤拍',text:'选择一件拍品永久移出库房，最低保留12件。'},copy:{name:'入库',text:'选择一件拍品复制，保留估值、类别与修复。'},rank:{name:'修复',text:'选择一件估值未满9的拍品，估值 +2。'},enhance:{name:'精鉴',text:'选择一件拍品，使其每次计价额外 +12估值。'},suit:{name:'换类',text:'选择一件拍品，再决定它的新类别。'},level:{name:'研习',text:'选择一种藏品组合，使其热度永久 +1。'}};

export const BOSSES:Partial<Record<number,{name:string;title:string;mark:string;intro:string;defeated:string;phases:readonly {name:string;text:string;quote:string}[]}>>={
 3:{name:'假面掮客',title:'签名买家',mark:'面',intro:'包厢帷幕拉起，没人看得清他的出价。',defeated:'假面落下，整场报价归你掌控。',phases:[{name:'冷场试探',text:'未撤换拍品的这一轮成交价×0.65；撤换可解除。',quote:'先证明你的货，才值得我举牌。'},{name:'假面偏好',text:'连续相同藏品组合的成交价×0.5；撤换不再解除压价。',quote:'同一种把戏，别想卖给我两次。'}]},
 7:{name:'终局收藏家',title:'最后买家',mark:'终',intro:'午夜包厢只亮着一盏灯，你只有三轮上拍机会。',defeated:'木槌落下，今夜最高成交归你。',phases:[{name:'静候珍品',text:'正常计价；满足40%预算后，下一轮开始最终契约。',quote:'让我看看，你的目录值不值得留到天亮。'},{name:'午夜契约',text:'本轮包含至少一件诡物则正常计价，否则成交价×0.6。',quote:'没有禁忌的收藏，配不上最后一槌。'}]},
};

export type Rarity='common'|'rare'|'legendary';
export const RARITY_NAMES:Record<Rarity,string>={common:'常客',rare:'名流',legendary:'传奇'};
export function companionRarity(id:CompanionId):Rarity{return ['zhugeliang','lvbu','chain'].includes(id)?'legendary':['zhangfei','zhaoyun','diaochan','scroll','oath','pursuit'].includes(id)?'rare':'common';}
export const SCORE_CAP=1_000_000_000_000;
export function forgeStage(s:{stage:number;challenge?:number}):{name:string;enemy:string;target:number;rule:string;text:string}{if(!s.challenge)return STAGES[s.stage];return{name:`无尽夜拍 · 第${s.challenge}场`,enemy:'永不散场的买家',target:Math.min(SCORE_CAP,Math.ceil(1900*1.6**Math.min(s.challenge,40))),rule:'none',text:'保留整套收藏继续冲击成交纪录。4轮上拍、2次撤换；失败仍保留八场完成记录与本局最高价。'};}
