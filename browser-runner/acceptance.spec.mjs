import {test,expect} from '@playwright/test';
import {dashboardServer} from '../src/dashboard-server.mjs';
let server,base;
test.beforeAll(async()=>{server=dashboardServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;});
test.afterAll(async()=>{await new Promise(r=>server.close(r));});
const upload=(page,id,name,content)=>page.locator('#'+id).setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(content)});
test('real local import, profile, quality, splits and comparison',async({page})=>{
 const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base+'/'))external.push(r.url());});
 await page.goto(base);
 const rows=[{id:'A',split:'train',label:1,price:3},{id:'A',split:'test',label:1,price:null},{id:'B',split:'validation',label:0,price:4}];
 await upload(page,'data','data.json',JSON.stringify(rows));
 await upload(page,'baseline','baseline.json',JSON.stringify([{...rows[0],price:2},rows[2]]));
 await upload(page,'contract','contract.json',JSON.stringify({schemaVersion:1,rules:[{id:'price-required',kind:'required',field:'price'}]}));
 await page.locator('#gov').check();await page.locator('#identity').fill('id');await page.getByRole('button',{name:'Analyze locally'}).click();
 await expect(page.getByRole('status')).toHaveText('Analysis complete');
 await expect(page.getByRole('heading',{name:'Dataset profile'})).toBeVisible();await expect(page.locator('#results')).toContainText('3 records');await expect(page.locator('#results')).toContainText('price-required');
 await expect(page.getByRole('heading',{name:'Split integrity'})).toBeVisible();await expect(page.locator('#results')).toContainText('1 cross-split overlaps');
 await expect(page.getByRole('heading',{name:'Dataset comparison'})).toBeVisible();await expect(page.locator('#results')).toContainText('2 added');expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('untrusted markup is text, malformed import clears old results',async({page})=>{
 await page.goto(base);const key='<img src=x onerror=alert(1)>';await upload(page,'data','data.json',JSON.stringify([{[key]:1}]));await page.locator('#run').click();await expect(page.getByRole('status')).toHaveText('Analysis complete');await expect(page.locator('#results')).toContainText(key);await expect(page.locator('#results img')).toHaveCount(0);
 await upload(page,'data','bad.json','[{"a":1,"a":2}]');await page.locator('#run').click();await expect(page.getByRole('status')).toContainText('Analysis failed');await expect(page.locator('#results')).toBeEmpty();
});
