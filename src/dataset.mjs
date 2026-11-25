import { createHash } from 'node:crypto';
import { open, realpath, lstat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve, relative, isAbsolute, sep, extname } from 'node:path';
export const VERSION=1;
export const LIMITS=Object.freeze({bytes:8*1024*1024,rows:50000,fields:256});
const hash=x=>createHash('sha256').update(x).digest('hex');
const own=(o,k)=>Object.hasOwn(o,k);
function rowCheck(row){
 if(!row||typeof row!=='object'||Array.isArray(row)) throw Error('Expected object record');
 const keys=Object.keys(row);
 if(keys.length>LIMITS.fields) throw Error('Too many fields');
 for(const k of keys){if(['__proto__','constructor','prototype'].includes(k)) throw Error('Unsafe field name');
 const v=row[k];if(v!==null&&!['string','number','boolean'].includes(typeof v)||typeof v==='number'&&!Number.isFinite(v)) throw Error('Expected finite scalar');}
 return row;
}
export function parseCsv(text){
 const rows=[];let row=[],field='',state=0;
 const push=()=>{row.push(field);field='';if(row.length>LIMITS.fields)throw Error('Too many fields');};
 const end=()=>{push();rows.push(row);row=[];state=0;if(rows.length>LIMITS.rows+1)throw Error('Too many records');};
 for(let i=0;i<text.length;i++){const c=text[i];
 if(state===1){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else state=2;}else field+=c;continue;}
 if(c===','){push();state=0;}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;end();}
 else if(state===2)throw Error('Invalid CSV quoting');
 else if(c==='"'){if(field.length)throw Error('Invalid CSV quoting');state=1;}else field+=c;
 }
 if(state===1)throw Error('Unclosed CSV quote');if(row.length||field.length||state===2)end();
 const headers=rows.shift();if(!headers||headers.some(k=>!k)||new Set(headers).size!==headers.length)throw Error('Invalid CSV headers');
 rowCheck(Object.fromEntries(headers.map(k=>[k,null])));
 return rows.map(r=>{if(r.length!==headers.length)throw Error('CSV width mismatch');return Object.fromEntries(headers.map((k,i)=>[k,r[i]]));});
}
// Flat JSON records only: reject duplicate decoded keys before constructing objects.
function strictJson(text, array){
 let i=0;const ws=()=>{while(i<text.length&&/[ \t\r\n]/.test(text[i]))i++;};
 const take=c=>{ws();if(text[i++]!==c)throw Error('Malformed JSON');};
 function str(){ws();if(text[i]!=='"')throw Error('Expected JSON string');const start=i++;while(i<text.length){const c=text[i++];if(c==='\\'){i++;continue;}if(c==='"')return JSON.parse(text.slice(start,i));}throw Error('Unterminated JSON string');}
 function value(){ws();if(text[i]==='"')return str();const start=i;while(i<text.length&&!/[ \t\r\n,}\]]/.test(text[i]))i++;if(start===i)throw Error('Expected scalar');const v=JSON.parse(text.slice(start,i));if(v!==null&&!['number','boolean'].includes(typeof v))throw Error('Expected scalar');return v;}
 function record(){take('{');const entries=[],seen=new Set();ws();if(text[i]==='}'){i++;return {};}while(true){const k=str();if(seen.has(k))throw Error('Duplicate JSON field');seen.add(k);if(seen.size>LIMITS.fields)throw Error('Too many fields');take(':');entries.push([k,value()]);ws();if(text[i]==='}'){i++;break;}take(',');}return rowCheck(Object.fromEntries(entries));}
 let result;if(array){take('[');result=[];ws();if(text[i]===']')i++;else while(true){if(result.length>=LIMITS.rows)throw Error('Too many records');result.push(record());ws();if(text[i]===']'){i++;break;}take(',');}}else result=record();ws();if(i!==text.length)throw Error('Trailing JSON input');return result;
}
export function parseDataset(bytes,format){
 if(!(bytes instanceof Uint8Array)||bytes.byteLength>LIMITS.bytes)throw Error('Input byte limit exceeded');
 const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);let rows;
 if(format==='csv')rows=parseCsv(text);
 else if(format==='json')rows=strictJson(text,true);
 else if(format==='jsonl'){rows=[];for(const line of text.split(/\r?\n/)){if(!line.trim())continue;if(rows.length>=LIMITS.rows)throw Error('Too many records');rows.push(strictJson(line,false));}}
 else throw Error('Unsupported format');
 if(!Array.isArray(rows)||rows.length>LIMITS.rows)throw Error('Invalid record count');
 rows.forEach(rowCheck);
 const digest=hash(bytes);
 return {schemaVersion:VERSION,id:'sha256:'+digest,sha256:digest,format,byteLength:bytes.byteLength,recordCount:rows.length,rows};
}
export async function ingest(root,path){
 const base=await realpath(root);
 const inside=p=>{const rel=relative(base,p);return !!rel&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep);};
 const candidate=resolve(base,path);if(!inside(candidate))throw Error('Path outside dataset root');
 const actual=await realpath(candidate);if(!inside(actual)||actual!==candidate)throw Error('Symlink or path outside root');
 const format=extname(actual).slice(1).toLowerCase();if(!['csv','json','jsonl'].includes(format))throw Error('Unsupported format');
 const before=await lstat(actual);if(!before.isFile())throw Error('Not a regular file');
 const fd=await open(actual,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{const stat=await fd.stat();if(!stat.isFile()||stat.dev!==before.dev||stat.ino!==before.ino||stat.size>LIMITS.bytes)throw Error('Not a bounded regular file');
 const buffer=Buffer.alloc(LIMITS.bytes+1);let offset=0;
 while(offset<buffer.length){const {bytesRead}=await fd.read(buffer,offset,buffer.length-offset,null);if(!bytesRead)break;offset+=bytesRead;}
 const after=await fd.stat();const current=await lstat(actual);if(await realpath(actual)!==actual||current.dev!==stat.dev||current.ino!==stat.ino||after.size!==stat.size||after.mtimeMs!==stat.mtimeMs||after.ctimeMs!==stat.ctimeMs||offset!==stat.size)throw Error('File changed during ingestion');
 return {...parseDataset(buffer.subarray(0,offset),format),provenance:{source:relative(base,actual)}};
 }finally{await fd.close();}
}
export function validate(dataset,schema){
 if(dataset.schemaVersion!==VERSION||schema?.schemaVersion!==VERSION||!Array.isArray(schema.fields)||schema.fields.length>LIMITS.fields)throw Error('Unsupported schema');
 const seen=new Set();for(const f of schema.fields){if(!f||typeof f.name!=='string'||!f.name||seen.has(f.name)||!['string','number','boolean','null'].includes(f.type)||typeof f.required!=='boolean')throw Error('Invalid field rule');seen.add(f.name);}
 const violations=[];dataset.rows.forEach((row,index)=>{for(const f of schema.fields){if(!own(row,f.name)){if(f.required)violations.push({index,field:f.name,code:'missing'});continue;}
 const type=row[f.name]===null?'null':typeof row[f.name];if(type!==f.type)violations.push({index,field:f.name,code:'type'});}});
 return {schemaVersion:VERSION,datasetId:dataset.id,passed:violations.length===0,violations};
}
