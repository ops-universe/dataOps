import { LIMITS, VERSION } from './dataset.mjs';
const own=(o,k)=>Object.hasOwn(o,k);
const type=v=>v===null?'null':typeof v;
const scalar=v=>v===null||['string','boolean'].includes(typeof v)||typeof v==='number'&&Number.isFinite(v);
const name=v=>typeof v==='string'&&v.length>0&&v.length<=256&&!['__proto__','prototype','constructor'].includes(v);
const kinds=new Set(['required','type','range','allowed','unique','pattern','compare']);
const types=new Set(['string','number','boolean','null']);
const ops=new Set(['eq','ne','lt','lte','gt','gte']);
function compile(rule){
 if(!rule||!name(rule.id)||!name(rule.field)||!kinds.has(rule.kind))throw Error('Invalid quality rule');
 const r={...rule};
 switch(r.kind){
 case 'type':if(!types.has(r.type))throw Error('Invalid type');break;
 case 'range':if(!Number.isFinite(r.min)||!Number.isFinite(r.max)||r.min>r.max)throw Error('Invalid range');break;
 case 'allowed':if(!Array.isArray(r.values)||r.values.length>1000||!r.values.every(scalar))throw Error('Invalid allowed values');r.set=new Set(r.values.map(JSON.stringify));break;
 case 'pattern':
 // A deliberately restricted glob: ASCII literals, ? (one code unit), * (zero or more).
 // No regex execution, backtracking or user-provided executable code.
 if(typeof r.pattern!=='string'||r.pattern.length>128||!r.pattern.length||!/^[ -~]+$/.test(r.pattern))throw Error('Invalid bounded glob');break;
 case 'compare':if(!name(r.other)||!ops.has(r.op))throw Error('Invalid comparison');break;
 }
 return r;
}
function glob(value,pattern){
 if(typeof value!=='string'||value.length>4096)return false;
 let prev=new Uint8Array(value.length+1);prev[0]=1;
 for(const c of pattern){const next=new Uint8Array(value.length+1);if(c==='*')next[0]=prev[0];for(let j=1;j<=value.length;j++)next[j]=c==='*'?(prev[j]||next[j-1]):(prev[j-1]&&(c==='?'||c===value[j-1])?1:0);prev=next;}
 return Boolean(prev[value.length]);
}
function compare(a,b,op){
 if(op==='eq')return a===b;if(op==='ne')return a!==b;
 if(type(a)!==type(b)||!['number','string'].includes(type(a)))return false;
 return op==='lt'?a<b:op==='lte'?a<=b:op==='gt'?a>b:a>=b;
}
export function quality(dataset,contract,{maxViolations=1000}={}){
 if(dataset?.schemaVersion!==VERSION||!Array.isArray(dataset.rows)||dataset.rows.length>LIMITS.rows||contract?.schemaVersion!==VERSION||!Array.isArray(contract.rules)||contract.rules.length>128||!Number.isInteger(maxViolations)||maxViolations<0||maxViolations>10000)throw Error('Invalid quality input');
 const rules=contract.rules.map(compile);if(new Set(rules.map(r=>r.id)).size!==rules.length)throw Error('Duplicate rule IDs');
 // Bound worst-case pattern work across entire run, not just per value.
 let work=0;for(const r of rules.filter(r=>r.kind==='pattern'))for(const row of dataset.rows){const v=row[r.field];if(typeof v==='string')work+=r.pattern.length*Math.min(v.length,4096);if(work>20_000_000)throw Error('Pattern work budget exceeded');}
 const seen=new Map(),violations=[],counts=Object.fromEntries(rules.map(r=>[r.id,0]));let failed=0,checks=0;
 for(const [index,row] of dataset.rows.entries())for(const r of rules){
 const present=own(row,r.field),v=row[r.field];let ok=true,code=r.kind;
 if(r.kind==='required'){checks++;ok=present&&v!==null;code=present?'null':'missing';}
 else if(!present||v===null)continue;
 else {checks++;switch(r.kind){
 case 'type':ok=type(v)===r.type;break;
 case 'range':ok=typeof v==='number'&&v>=r.min&&v<=r.max;break;
 case 'allowed':ok=r.set.has(JSON.stringify(v));break;
 case 'unique':{if(!seen.has(r.id))seen.set(r.id,new Set());const s=seen.get(r.id),k=JSON.stringify(v);ok=!s.has(k);s.add(k);break;}
 case 'pattern':ok=glob(v,r.pattern);break;
 case 'compare':ok=own(row,r.other)&&row[r.other]!==null&&compare(v,row[r.other],r.op);break;
 }}
 if(!ok){failed++;counts[r.id]++;if(violations.length<maxViolations)violations.push({index,field:r.field,ruleId:r.id,code});}
 }
 return {schemaVersion:VERSION,datasetId:dataset.id,passed:failed===0,checks,failed,score:checks?Math.round(10000*(checks-failed)/checks)/100:null,counts,violations,truncated:failed>violations.length};
}
