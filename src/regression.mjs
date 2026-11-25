import {createHash} from 'node:crypto';
import {VERSION,LIMITS} from './dataset.mjs';
import {profile} from './profile.mjs';
import {quality} from './quality.mjs';
const canonical=row=>JSON.stringify(Object.keys(row).sort().map(k=>[k,row[k]]));
const hash=s=>createHash('sha256').update(s).digest('hex');
function multiset(d){const m=new Map();for(const row of d.rows){const k=hash(canonical(row));m.set(k,(m.get(k)||0)+1);}return m;}
function counts(d,name){const m=new Map();for(const row of d.rows){const k=Object.hasOwn(row,name)?JSON.stringify(row[name]):'missing';m.set(k,(m.get(k)||0)+1);}return m;}
export function compareDatasets(before,after,contract){
 for(const d of [before,after])if(d?.schemaVersion!==VERSION||!Array.isArray(d.rows)||d.rows.length>LIMITS.rows)throw Error('Invalid dataset');
 const a=profile(before,{maxCategories:0}),b=profile(after,{maxCategories:0}),am=multiset(before),bm=multiset(after);
 let added=0,removed=0;for(const [k,n] of bm)added+=Math.max(0,n-(am.get(k)||0));for(const [k,n] of am)removed+=Math.max(0,n-(bm.get(k)||0));
 const fields=[...new Set([...a.fields.map(f=>f.name),...b.fields.map(f=>f.name)])].sort();
 if(fields.length>LIMITS.fields)throw Error('Comparison field limit exceeded');
 const drift=fields.map(field=>{const x=counts(before,field),y=counts(after,field);let tv=null;if(before.rows.length&&after.rows.length){tv=0;for(const k of new Set([...x.keys(),...y.keys()]))tv+=Math.abs((x.get(k)||0)/before.rows.length-(y.get(k)||0)/after.rows.length);tv=Math.min(1,tv/2);}return {field,totalVariation:tv};});
 const qa=contract?quality(before,contract):null,qb=contract?quality(after,contract):null;
 // Compare violation counts by rule; not record-level attribution.
 const increases=qa?Object.keys(qb.counts).sort().map(ruleId=>({ruleId,increase:Math.max(0,qb.counts[ruleId]-qa.counts[ruleId])})).filter(x=>x.increase):[];
 return {schemaVersion:VERSION,beforeId:before.id,afterId:after.id,beforeFingerprint:hash(JSON.stringify([...am].sort())),afterFingerprint:hash(JSON.stringify([...bm].sort())),addedRecords:added,removedRecords:removed,recordCountChange:b.recordCount-a.recordCount,drift,quality:qa?{beforeScore:qa.score,afterScore:qb.score,scoreChange:qa.score===null||qb.score===null?null:qb.score-qa.score,increases,passed:qb.passed&&increases.length===0&&qb.score!==null}:null};
}
