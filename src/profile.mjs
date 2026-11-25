import { LIMITS, VERSION } from './dataset.mjs';
const key=v=>JSON.stringify(v);
const fingerprint=row=>JSON.stringify(Object.keys(row).sort().map(k=>[k,row[k]]));
export function profile(dataset,{maxCategories=20}={}){
 if(dataset.schemaVersion!==VERSION||!Array.isArray(dataset.rows)||dataset.rows.length>LIMITS.rows||!Number.isInteger(maxCategories)||maxCategories<0||maxCategories>100)throw Error('Invalid profile input');
 const rows=dataset.rows, fields=new Map(), records=new Set();let duplicates=0;
 for(const row of rows){
  const id=fingerprint(row);if(records.has(id))duplicates++;else records.add(id);
  for(const [name,value] of Object.entries(row)){
   if(!fields.has(name)){if(fields.size>=LIMITS.fields)throw Error('Dataset field limit exceeded');fields.set(name,{present:0,nulls:0,types:{string:0,number:0,boolean:0,null:0},values:new Map(),min:null,max:null,mean:0,count:0});}
   const f=fields.get(name),type=value===null?'null':typeof value;f.present++;f.types[type]++;if(value===null){f.nulls++;continue;}
   const k=key(value);f.values.set(k,(f.values.get(k)||0)+1);
   if(type==='number'){f.count++;f.min=f.min===null?value:Math.min(f.min,value);f.max=f.max===null?value:Math.max(f.max,value);f.mean=f.mean*((f.count-1)/f.count)+value/f.count;}
  }
 }
 return {schemaVersion:VERSION,datasetId:dataset.id,recordCount:rows.length,duplicateRecords:duplicates,uniqueRecords:records.size,fields:[...fields].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([name,f])=>({name,present:f.present,missing:rows.length-f.present,nulls:f.nulls,types:f.types,uniqueNonNull:f.values.size,numeric:f.count?{count:f.count,min:f.min,max:f.max,mean:Number.isFinite(f.mean)?f.mean:null}:null,categories:[...f.values].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:a[0]>b[0]?1:0)).slice(0,maxCategories).map(([v,count])=>({value:JSON.parse(v),count})),omittedCategories:Math.max(0,f.values.size-maxCategories)}))};
}
