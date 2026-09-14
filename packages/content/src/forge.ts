/** v0.7 content: all effects are implemented by the core, never executable text. */
export const FORGE_VERSION='0.7.0';
export const FORGE_RULES={hands:4,discards:2,handSize:6,slots:5,startGold:12,minDeck:12,maxDeck:60,baseMult:[1,2,3,4,6,10],levelMult:1,refreshBase:3,editCost:8,pressureReward:8,pressureFactor:1.5} as const;
export const COMPANIONS={
 pursuit:{name:'马超',mark:'马',role:'接力',price:12,text:'每次额外计分后，35%概率让该牌再额外计分；每手最多追击3次。',hint:'张飞、周瑜、赵云和诸葛亮都能让马超起跑。',effect:'burst-repeat'},
 chain:{name:'陆逊',mark:'陆',role:'响应',price:16,text:'每次阵牌额外计分后，+3倍率。',hint:'不区分是谁发起；确定额外计分和马超追击都会放大。',effect:'burst-mult'},
 guanyu:{name:'关羽',mark:'关',role:'成长',price:10,text:'打出对子或本手发生额外计分，关羽永久 +1 倍率；每手一次。',hint:'自己能靠对子成长，也能接入任何额外计分来源。',effect:'pair-growth'},
 zhangfei:{name:'张飞',mark:'张',role:'发起',price:12,text:'含对子时，第一张对子牌额外计分一次。',hint:'让该牌的强化与逐牌将星再次发动。',effect:'pair-repeat'},
 liubei:{name:'刘备',mark:'刘',role:'响应',price:10,text:'每当不大于4点的牌计分，+6倍率。',hint:'额外计分时也发动，可接张飞、周瑜、赵云或诸葛亮。',effect:'low-card'},
 zhouyu:{name:'周瑜',mark:'周',role:'发起',price:10,text:'至少两张同兵种时，这些同兵种牌各额外计分一次。',hint:'两张即可启动；三张同兵种会发起三次接力。',effect:'two-suit'},
 zhaoyun:{name:'赵云',mark:'赵',role:'发起',price:10,text:'打出连阵或同袍连阵时，最低点牌额外计分一次。',hint:'低点牌可以继续触发刘备，也能带动追击。',effect:'straight-growth'},
 huangzhong:{name:'黄忠',mark:'黄',role:'逐牌',price:9,text:'每张点数不小于7的牌计分时，+18点数。',hint:'升点、复制和重触发共同放大高点牌。',effect:'high-chips'},
 zhugeliang:{name:'诸葛亮',mark:'诸',role:'发起',price:14,text:'最右侧出牌额外计分一次。',hint:'不要求阵型，能把任意逐牌效果接入连锁。',effect:'last-repeat'},
 caocao:{name:'曹操',mark:'曹',role:'经济',price:8,text:'每次换牌获得2军资。',hint:'与公孙瓒增加换牌次数、鲁肃存钱相互配合。',effect:'discard-gold'},
 sunquan:{name:'孙权',mark:'孙',role:'杂兵',price:9,text:'出牌包含三种不同兵种，+4倍率。',hint:'保留多种兵种，走另一条成型路线。',effect:'mixed-suits'},
 lvbu:{name:'吕布',mark:'吕',role:'爆发',price:12,text:'打出三军同心，当前倍率 ×3。',hint:'复制相同点数，提高三军同心出现频率。',effect:'triple-mult'},
 diaochan:{name:'貂蝉',mark:'貂',role:'响应',price:10,text:'每当谋牌计分，+2倍率。',hint:'谋牌额外计分时也发动；改编可以制造核心牌。',effect:'scheme-mult'},
 simayi:{name:'司马懿',mark:'司',role:'压轴',price:10,text:'本关最后一次出牌，当前倍率 ×2。',hint:'可以保底，也可以为最后一手蓄力。',effect:'last-hand'},
 blade:{name:'太史慈',mark:'太',role:'逐牌',price:11,text:'神亭酣战：每张点数不小于7的牌计分时，+2倍率。',hint:'同一张牌的重触发会再次获得倍率。',effect:'high-mult'},
 drum:{name:'张辽',mark:'辽',role:'基础',price:7,text:'威震逍遥津：出牌含对子，+30点数。',hint:'提供前期强度，之后再考虑是否腾位置。',effect:'pair-chips'},
 horse:{name:'公孙瓒',mark:'瓒',role:'换牌',price:8,text:'白马义从：每关换牌次数 +1。',hint:'战前结算次数，可为组牌和军资服务。',effect:'extra-discard'},
 scroll:{name:'庞统',mark:'庞',role:'规则',price:12,text:'连环奇谋：三个不同点数，排序后相邻间隔至多2，也可组成连阵。',hint:'例如1、3、5；同兵种则组成同袍连阵。',effect:'gap-straight'},
 seal:{name:'董卓',mark:'董',role:'加压',price:9,text:'暴政压阵：选择加压的关卡，当前倍率 ×1.25。',hint:'战前目标增加50%，胜后额外获得8军资。',effect:'pressure-mult'},
 granary:{name:'鲁肃',mark:'鲁',role:'经济',price:9,text:'屯粮济军：每持有5军资，+1倍率，上限 +8。',hint:'现在花钱补强，还是存钱吃利息和倍率？',effect:'wealth-mult'},
 abacus:{name:'荀彧',mark:'荀',role:'精简',price:8,text:'王佐简兵：牌库少于36张时，每少一张，+6点数。',hint:'删牌既改善抽牌稳定性，也提高攻势。',effect:'thin-deck'},
 oath:{name:'孙策',mark:'策',role:'爆发',price:12,text:'江东同袍：三张牌同兵种，当前倍率 ×1.8。',hint:'和周瑜、貂蝉及改编兵种相互配合。',effect:'flush-mult'},
} as const;
export type CompanionId=keyof typeof COMPANIONS;
export const ALL_COMPANION_IDS=Object.keys(COMPANIONS) as CompanionId[];
/** New runs only: twelve freely combinable generals. Other stable IDs remain loadable for v8 saves. */
export const COMPANION_IDS:CompanionId[]=['guanyu','zhangfei','pursuit','chain','liubei','zhugeliang','caocao','abacus','zhouyu','diaochan','oath','zhaoyun'];
export const STARTERS:CompanionId[]=['guanyu','zhouyu','liubei'];
export const STAGES=[
 {name:'初出茅庐',enemy:'黄巾前哨',target:180,rule:'none',text:'四次出牌内积累足够攻势。'},
 {name:'长坂试锋',enemy:'黄巾游骑',target:220,rule:'none',text:'组牌、招募与整编的成果开始显现。'},
 {name:'虎牢列阵',enemy:'铁甲先锋',target:320,rule:'high-armor',text:'铁甲：点数7–9的牌基础点数按0计；逐牌将星仍生效。'},
 {name:'地公设坛',enemy:'张宝 · 地公将军',target:600,rule:'ambush',text:'首领张宝：前40%兵力为伏击，换牌解除本手减伤；之后转入疑阵，连续同牌型攻势减半。'},
 {name:'官渡鏖兵',enemy:'黄巾督军',target:950,rule:'none',text:'高目标检验成长与倍率的积累。'},
 {name:'赤壁逆风',enemy:'雷鼓祭司',target:1350,rule:'variety',text:'疑阵：连续打出相同牌型时，最终攻势减半。'},
 {name:'破军前夜',enemy:'黄巾渠帅',target:1800,rule:'flank',text:'渠帅识阵：首张出牌兵种与上一手相同时，攻势减半。改变首牌兵种可绕过。'},
 {name:'苍天已死',enemy:'张角',target:1900,rule:'last-stand',text:'终局张角：仅3次出牌。击破40%兵力后唤雷；出牌后手中未留下谋牌，攻势×0.6。'},
] as const;
export type ForgeEdit='remove'|'copy'|'rank'|'enhance'|'suit'|'level';
export const EDITS:Record<ForgeEdit,{name:string;text:string}>={remove:{name:'裁军',text:'选择一张牌永久删除，牌库最低12张。'},copy:{name:'募兵',text:'选择一张牌复制，保留点数、兵种与强化。'},rank:{name:'练兵',text:'选择一张未满9点的牌，点数 +2。'},enhance:{name:'精锐',text:'选择一张牌，使其每次计分额外 +12点数。'},suit:{name:'改编',text:'选择一张牌，再决定它的新兵种。'},level:{name:'研习',text:'选择一种阵型，使其倍率永久 +1。'}};

export const BOSSES:Partial<Record<number,{name:string;title:string;mark:string;intro:string;defeated:string;phases:readonly {name:string;text:string;quote:string}[]}>>={
 3:{name:'张宝',title:'地公将军',mark:'地',intro:'雾锁祭坛，黄巾伏兵四起。',defeated:'地公坛破，疑阵尽散。',phases:[{name:'伏兵蔽日',text:'未换牌的这一手攻势×0.65；换牌可解除。',quote:'入我阵中，还想全身而退？'},{name:'移形疑阵',text:'连续相同牌型攻势×0.5；换牌不再解除减伤。',quote:'破得了伏兵，可识得我的疑阵？'}]},
 7:{name:'张角',title:'天公将军',mark:'天',intro:'黄天祭坛前，只剩三次出手机会。',defeated:'雷云散去，黄天大旗倾倒。',phases:[{name:'黄天蓄雷',text:'正常计分；击破40%兵力后，下一手开始雷劫。',quote:'苍天已死，黄天当立！'},{name:'九天雷劫',text:'出牌后手中留有谋牌则正常计分，否则攻势×0.6。',quote:'以谋避雷，还是倾尽全军？'}]},
};

export type Rarity='common'|'rare'|'legendary';
export const RARITY_NAMES:Record<Rarity,string>={common:'良将',rare:'名将',legendary:'传奇'};
export function companionRarity(id:CompanionId):Rarity{return ['zhugeliang','lvbu','chain'].includes(id)?'legendary':['zhangfei','zhaoyun','diaochan','scroll','oath','pursuit'].includes(id)?'rare':'common';}
export const SCORE_CAP=1_000_000_000_000;
export function forgeStage(s:{stage:number;challenge?:number}):{name:string;enemy:string;target:number;rule:string;text:string}{if(!s.challenge)return STAGES[s.stage];return{name:`极限挑战 · 第${s.challenge}层`,enemy:'无尽军势',target:Math.min(SCORE_CAP,Math.ceil(1900*1.6**Math.min(s.challenge,40))),rule:'none',text:'保留整套构筑继续冲分。4次出牌、2次换牌；失败仍保留八关通关与本局纪录。'};}
