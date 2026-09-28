// Development-only browser QA; no dependency is shipped to the static site.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript'}[path.extname(file)]||'text/plain'));res.end(data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(8000,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true});
  const errors=[],checks=[];fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
  const base=process.env.TEST_URL||'http://127.0.0.1:8000/';
  async function overflow(page,where){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),where+' horizontal overflow');checks.push(where+' fits viewport');}
  async function generate(page){await page.getByRole('button',{name:'Generate Recommendation'}).click();await page.locator('#result-step').waitFor({state:'visible'});}
  async function select(page,id){await page.getByRole('button',{name:'Start New Recommendation'}).click();await page.locator('label[for="commodity-'+id+'"]').click();await page.getByRole('button',{name:'Continue to Storage'}).click();}
  for(const [width,height] of [[1440,1000],[390,844],[320,740]]){
    const page=await browser.newPage({viewport:{width,height}});
    page.on('pageerror',err=>errors.push(err.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
    page.on('response',res=>{if(res.status()>=400)errors.push(res.status()+' '+res.url());});
    await page.goto(base,{waitUntil:'networkidle'});
    assert.equal(await page.title(),'PackWise AI — Intelligent Food Packaging');
    assert.equal(await page.locator('#start').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(18, 99, 76)');
    await overflow(page,width+' home');await page.screenshot({path:path.join(root,'test-output',width+'-home.png'),fullPage:true});
    await page.getByRole('button',{name:'Get Packaging Recommendation'}).click();
    assert.equal(await page.locator('#moisture').inputValue(),'94');await overflow(page,width+' product');
    await page.getByRole('button',{name:'Continue to Storage'}).click();await overflow(page,width+' storage');
    await generate(page);assert.match(await page.locator('.recommendation-hero h2').innerText(),/Micro-perforated LDPE/);assert.equal(await page.locator('.map-card').count(),1);
    await overflow(page,width+' tomato results');await page.screenshot({path:path.join(root,'test-output',width+'-tomato.png'),fullPage:true});
    const before=await page.locator('.reason-list').innerText();
    await page.getByRole('button',{name:'Adjust inputs'}).click();await page.locator('#transport').selectOption('rough');await generate(page);
    assert.notEqual(before,await page.locator('.reason-list').innerText());assert.match(await page.locator('.reason-list').innerText(),/Rough handling/);
    await select(page,'chips');await generate(page);assert.match(await page.locator('.recommendation-hero h2').innerText(),/Metallized/);assert.equal(await page.locator('.map-card').count(),0);await overflow(page,width+' chips results');
    await page.screenshot({path:path.join(root,'test-output',width+'-chips.png'),fullPage:true});
    await page.getByText('How was this recommendation generated?',{exact:true}).click();assert.ok(await page.locator('.transparency table').isVisible());await overflow(page,width+' expanded comparison');
    if(width===1440){
      for(const id of ['apple','potato','biscuits','rice','milk','oil']){await select(page,id);await generate(page);assert.ok((await page.locator('.recommendation-hero h2').innerText()).length>3);checks.push(id+' full browser flow');}
      await page.getByRole('button',{name:'Adjust inputs'}).click();await page.getByRole('button',{name:'Product details'}).click();
      await page.locator('label[for="commodity-apple"]').click();await page.locator('#respiration').selectOption('1');await page.getByRole('button',{name:'Continue to Storage'}).click();await generate(page);const low=await page.locator('.recommendation-hero h2').innerText();
      await page.getByRole('button',{name:'Adjust inputs'}).click();await page.getByRole('button',{name:'Product details'}).click();await page.locator('#respiration').selectOption('3');await page.getByRole('button',{name:'Continue to Storage'}).click();await generate(page);assert.notEqual(low,await page.locator('.recommendation-hero h2').innerText());checks.push('changed respiration changes material');
      await page.getByRole('button',{name:'Adjust inputs'}).click();await page.locator('#storage').selectOption('frozen');await page.locator('#temp').fill('20');await page.getByRole('button',{name:'Product details'}).click();await page.getByRole('button',{name:'Continue to Storage'}).click();assert.ok(await page.locator('#storage-step').isVisible());await page.getByRole('button',{name:'Generate Recommendation'}).click();assert.match(await page.locator('#storage-error').innerText(),/Frozen storage/);await page.locator('#temp').fill('-18');await generate(page);assert.equal(await page.locator('.map-card').count(),0);checks.push('invalid storage recovery and frozen flow');
      await page.getByRole('button',{name:'Start New Recommendation'}).click();await page.locator('#fat').fill('90');await page.getByRole('button',{name:'Continue to Storage'}).click();assert.match(await page.locator('#product-error').innerText(),/100%/);await page.locator('#fat').fill('0.2');await page.getByRole('button',{name:'Continue to Storage'}).click();await generate(page);checks.push('invalid composition recovery');
      await page.evaluate(()=>{window.__printed=false;window.print=()=>{window.__printed=true;};});await page.getByRole('button',{name:'Print / Save Result'}).click();assert.equal(await page.evaluate(()=>window.__printed),true);await page.emulateMedia({media:'print'});await page.pdf({path:path.join(root,'test-output','tomato-print.pdf'),format:'A4',printBackground:true});checks.push('print action and PDF rendering');
    }
    checks.push(width+' tomato/chips, changed transport, navigation, reset, explanations');await page.close();
  }
  assert.deepEqual(errors,[],'Browser console/runtime/network errors');checks.push('zero browser errors');
  fs.writeFileSync(path.join(root,'test-output','report.json'),JSON.stringify({base,checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));await browser.close();server.close();
})().catch(err=>{console.error(err);server.close();process.exit(1);});
