export type BossMotion='idle'|'hit'|'thunder'|'defeat';

const ROOT='./assets/bosses/zhang-jiao/';
const FRAMES:Record<BossMotion,string[]>={
 idle:Array.from({length:4},(_,i)=>`idle-${i}.png`),
 hit:Array.from({length:6},(_,i)=>`hit-${i}.png`),
 thunder:Array.from({length:9},(_,i)=>`thunder-${i}.png`),
 defeat:Array.from({length:7},(_,i)=>`defeat-${i}.png`),
};
const FRAME_MS:Record<BossMotion,number>={idle:190,hit:95,thunder:115,defeat:130};
let timer:ReturnType<typeof setTimeout>|undefined,currentKey='',started=0;

export function zhangJiaoActor(motion:BossMotion,key:string){return `<div class="boss-actor boss-motion-${motion}" aria-hidden="true"><i class="boss-aura"></i><i class="boss-lightning one"></i><i class="boss-lightning two"></i><img src="${ROOT}${FRAMES[motion][0]}" data-boss-motion="${motion}" data-boss-key="${key}" alt=""></div>`;}

export function runBossMotion(){
 clearTimeout(timer);
 const image=document.querySelector<HTMLImageElement>('img[data-boss-motion]');
 if(!image){currentKey='';return;}
 const motion=image.dataset.bossMotion as BossMotion,key=image.dataset.bossKey!,frames=FRAMES[motion];
 if(key!==currentKey){currentKey=key;started=performance.now();}
 const elapsed=performance.now()-started,raw=Math.floor(elapsed/FRAME_MS[motion]);
 const index=motion==='idle'?raw%frames.length:Math.min(frames.length-1,raw);
 image.src=ROOT+frames[index];
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&(motion==='idle'||index<frames.length-1))timer=setTimeout(runBossMotion,FRAME_MS[motion]);
}
