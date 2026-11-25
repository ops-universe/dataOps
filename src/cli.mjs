import {ingest,LIMITS} from './dataset.mjs';
import {profile} from './profile.mjs';
import {quality} from './quality.mjs';
import {governance} from './governance.mjs';
import {compareDatasets} from './regression.mjs';
import {open,realpath,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,relative,isAbsolute,sep} from 'node:path';
async function contract(root,path){
 const base=await realpath(root),p=resolve(base,path),rel=relative(base,p);
 if(!rel||isAbsolute(rel)||rel==='..'||rel.startsWith('..'+sep)||await realpath(p)!==p)throw Error('Invalid contract path');
 const before=await lstat(p);if(!before.isFile())throw Error('Not a regular contract');
 const fd=await open(p,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{const st=await fd.stat();if(!st.isFile()||st.dev!==before.dev||st.ino!==before.ino||st.size>65536)throw Error('Invalid contract file');
 const bytes=Buffer.alloc(65537);let n=0;while(n<bytes.length){const r=await fd.read(bytes,n,bytes.length-n,null);if(!r.bytesRead)break;n+=r.bytesRead;}
 const end=await fd.stat(),current=await lstat(p);if(n>65536||n!==st.size||end.mtimeMs!==st.mtimeMs||end.ctimeMs!==st.ctimeMs||current.ino!==st.ino||current.dev!==st.dev||await realpath(p)!==p)throw Error('Contract changed');
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,n)));
 }finally{await fd.close();}
}
const [cmd,root,...args]=process.argv.slice(2);
try{
 let report,gate=false;
 if(cmd==='profile'&&args.length===1)report=profile(await ingest(root,args[0]),{maxCategories:0});
 else if(cmd==='quality'&&args.length===2){report=quality(await ingest(root,args[0]),await contract(root,args[1]));gate=true;}
 else if(cmd==='governance'&&args.length>=1&&args.length<=33){report=governance(await ingest(root,args[0]),{identityFields:args.slice(1)});report.labels=report.labels.map(({counts})=>({counts}));gate=true;}
 else if(cmd==='compare'&&(args.length===2||args.length===3)){report=compareDatasets(await ingest(root,args[0]),await ingest(root,args[1]),args[2]?await contract(root,args[2]):undefined);gate=Boolean(args[2]);}
 else throw Error('Usage: profile ROOT DATA | quality ROOT DATA CONTRACT | governance ROOT DATA [IDENTITY...] | compare ROOT BEFORE AFTER [CONTRACT]');
 console.log(JSON.stringify(report,null,2));
 if(gate&&!(report.quality?.passed??(report.passed&&report.score!==null)))process.exitCode=1;
}catch{console.error('dataOps: invalid arguments, input, contract or resource limit');process.exitCode=2;}
