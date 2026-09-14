import {readFile} from 'node:fs/promises';
import {AiPlayService} from './ai-play-lib';

try{
 const index=process.argv.indexOf('--request');if(index>=0&&!process.argv[index+1])throw Error('--request requires a JSON file path');
 const source=index>=0?await readFile(process.argv[index+1],'utf8'):await new Promise<string>((resolve,reject)=>{let data='';process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>data+=chunk);process.stdin.on('end',()=>resolve(data));process.stdin.on('error',reject);});
 if(!source.trim())throw Error('provide one JSON request through --request or stdin');process.stdout.write(JSON.stringify(await new AiPlayService().handle(JSON.parse(source)),null,2)+'\n');
}catch(error){process.stderr.write((error instanceof Error?error.message:String(error))+'\n');process.exitCode=1;}
