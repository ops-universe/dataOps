import {createServer} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {parseDataset,LIMITS} from './dataset.mjs';
import {profile} from './profile.mjs';
import {quality} from './quality.mjs';
import {governance} from './governance.mjs';
import {compareDatasets} from './regression.mjs';
import {dashboardHtml} from './dashboard-page.mjs';
import {pathToFileURL} from 'node:url';
const maxBody=24*1024*1024;
export function analyze(input){
 if(!input||typeof input.text!=='string'||!['csv','json','jsonl'].includes(input.format))throw Error('Invalid dataset');
 const dataset=parseDataset(Buffer.from(input.text),input.format);
 const p=profile(dataset,{maxCategories:0});
 const result={profile:p};
 if(input.contract!==undefined)result.quality=quality(dataset,input.contract,{maxViolations:500});
 if(input.governance===true){const g=governance(dataset,{identityFields:input.identityFields??[]});result.governance={...g,labels:g.labels.map(({counts})=>({counts}))};}
 if(input.baseline!==undefined){if(typeof input.baseline!=='string')throw Error('Invalid baseline');result.comparison=compareDatasets(parseDataset(Buffer.from(input.baseline),input.format),dataset,input.contract);}
 return result;
}
export function dashboardServer(){
 const token=randomBytes(32).toString('hex');let busy=false;
 const server=createServer(async(req,res)=>{
 const address=server.address();const host='127.0.0.1:'+address.port;
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'nonce-"+token+"'; style-src 'nonce-"+token+"'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
 const send=(status,data,type='application/json')=>{res.writeHead(status,{'Content-Type':type});res.end(type==='application/json'?JSON.stringify(data):data);};
 if(req.headers.host!==host)return send(403,{error:'Invalid host'});
 if(req.method==='GET'&&req.url==='/')return send(200,dashboardHtml(token),'text/html; charset=utf-8');
 if(req.method!=='POST'||req.url!=='/analyze')return send(404,{error:'Not found'});
 const provided=Buffer.from(String(req.headers['x-dataops-token']??''));const expected=Buffer.from(token);
 if(req.headers.origin!=='http://'+host||provided.length!==expected.length||!timingSafeEqual(provided,expected)||req.headers['content-type']!=='application/json')return send(403,{error:'Denied'});
 if(busy)return send(429,{error:'Busy'});
 busy=true;
 try{let size=0;const parts=[];for await(const chunk of req){size+=chunk.length;if(size>maxBody){send(413,{error:'Input limit'});return;}parts.push(chunk);}
 const input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(parts)));send(200,analyze(input));
 }catch{if(!res.headersSent)send(400,{error:'Invalid data, contract or resource limit'});}finally{busy=false;}
 });server.requestTimeout=15000;server.headersTimeout=10000;return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const s=dashboardServer();s.listen(0,'127.0.0.1',()=>console.log('Local dashboard: http://127.0.0.1:'+s.address().port));}
