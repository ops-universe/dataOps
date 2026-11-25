import {createHash} from 'node:crypto';import {VERSION,LIMITS} from './dataset.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const canonical=row=>JSON.stringify(Object.keys(row).sort().map(k=>[k,row[k]]));
export function governance(dataset,{splitField='split',labelField='label',identityFields=[],maxEvidence=100}={}){
 if(dataset?.schemaVersion!==VERSION||!Array.isArray(dataset.rows)||dataset.rows.length>LIMITS.rows||typeof splitField!=='string'||typeof labelField!=='string'||!Array.isArray(identityFields)||identityFields.length>32||!identityFields.every(x=>typeof x==='string'&&x.length>0)||new Set(identityFields).size!==identityFields.length||!Number.isInteger(maxEvidence)||maxEvidence<0||maxEvidence>1000)throw Error('Invalid governance input');
 const splits={train:0,validation:0,test:0},labels=new Map(),seen=new Map(),evidence=[],fingerprints=[],sensitive={email:0,phoneLike:0},invalid={split:0,identity:0,label:0};let crossSplit=0;
 for(const [index,row] of dataset.rows.entries()){
 const split=row[splitField];const full=hash(canonical(row));fingerprints.push(full);
 for(const v of Object.values(row)){if(typeof v!=='string'||v.length>4096)continue;if(/\b[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,63}\b/.test(v))sensitive.email++;if(/(?:^|\s)\+?\d[\d ()-]{7,18}\d(?:$|\s)/.test(v))sensitive.phoneLike++;}
 if(typeof split!=='string'||!Object.hasOwn(splits,split)){invalid.split++;continue;}splits[split]++;
 if(!Object.hasOwn(row,labelField)||row[labelField]===null)invalid.label++;else{const k=JSON.stringify(row[labelField]);if(!labels.has(k))labels.set(k,{train:0,validation:0,test:0});labels.get(k)[split]++;}
 const keys=identityFields.length?identityFields:Object.keys(row).filter(k=>k!==splitField).sort();
 if(!keys.length||keys.some(k=>!Object.hasOwn(row,k)||row[k]===null)){invalid.identity++;continue;}
 const id=hash(JSON.stringify(keys.slice().sort().map(k=>[k,row[k]])));if(!seen.has(id))seen.set(id,new Map());const prior=seen.get(id);if([...prior.keys()].some(k=>k!==split)){crossSplit++;if(evidence.length<maxEvidence)evidence.push({index,split,otherSplits:[...prior.keys()].filter(k=>k!==split).sort()});}if(!prior.has(split))prior.set(split,index);
 }
 return {schemaVersion:VERSION,datasetId:dataset.id,fingerprint:hash(JSON.stringify(fingerprints.sort())),splits,emptySplits:Object.keys(splits).filter(k=>splits[k]===0),invalid,crossSplit,evidence,truncated:crossSplit>evidence.length,labels:[...labels].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([label,counts])=>({label:JSON.parse(label),counts})),sensitive,passed:crossSplit===0&&Object.values(invalid).every(x=>x===0)&&Object.values(splits).every(x=>x>0),limitations:'Exact identity overlap and heuristic indicators only; not anonymization or leakage prevention.'};
}
