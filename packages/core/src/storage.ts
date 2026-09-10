import { hash } from './random';
import { CONTENT_VERSION } from '@three-card/content';
import { isRunState, type RunState } from './campaign';
export interface StorageAdapter { get(key:string):string|null; set(key:string,value:string):void }
interface Envelope { generation:number; payload:string; checksum:number }
const PREFIX='three-card:v1';
function envelope(raw:string|null):Envelope|null{try{const e=JSON.parse(raw??'null');return e&&Number.isSafeInteger(e.generation)&&e.generation>=0&&typeof e.payload==='string'&&hash(e.payload)===e.checksum?e:null;}catch{return null;}}
function records(storage:StorageAdapter){return [0,1].map(slot=>({slot,e:envelope(storage.get(`${PREFIX}:${slot}`))})).filter((x):x is {slot:number;e:Envelope}=>!!x.e).sort((a,b)=>b.e.generation-a.e.generation);}
export function saveRun(storage:StorageAdapter,state:RunState):void {
  const current=records(storage)[0];const slot=current?1-current.slot:0;const payload=JSON.stringify(state);
  const data:Envelope={generation:(current?.e.generation??0)+1,payload,checksum:hash(payload)};const key=`${PREFIX}:${slot}`;
  storage.set(key,JSON.stringify(data));const verify=envelope(storage.get(key));
  if(!verify||verify.payload!==payload||verify.generation!==data.generation)throw Error('存档写入校验失败');
  storage.set(`${PREFIX}:head`,String(slot));
}
export function loadRun(storage:StorageAdapter):{state:RunState|null;notice:string|null}{
  const all=records(storage);let invalid=[0,1].filter(slot=>storage.get(`${PREFIX}:${slot}`)!==null&&!envelope(storage.get(`${PREFIX}:${slot}`))).length;
  for(const {e} of all){try{const value=JSON.parse(e.payload);if(isRunState(value)&&value.contentVersion===CONTENT_VERSION)return{state:value,notice:invalid?'已恢复上一份兼容存档。':null};}catch{/* Try previous complete slot. */}invalid++;}
  const hasRaw=storage.get(`${PREFIX}:0`)!==null||storage.get(`${PREFIX}:1`)!==null;
  return{state:null,notice:hasRaw?'旧存档损坏或版本不兼容，已保留。请开始新征程。':null};
}
export function backupRun(storage:StorageAdapter):void {
  // Preserve incompatible data before the first new-game write, not on every action.
  for(const slot of [0,1]){const raw=storage.get(`${PREFIX}:${slot}`);if(raw!==null)storage.set(`${PREFIX}:backup:${slot}`,raw);}
}
