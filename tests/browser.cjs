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
    assert.equal(await page.title(),'SmartPack — Intelligent Food Packaging');
    assert.equal(await page.locator('#start').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(54, 66, 88)');
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
    // Custom mode is tested at every viewport, in addition to all existing flows.
    await page.getByRole('button',{name:'Start New Recommendation'}).click();
    await page.locator('label[for="commodity-custom"]').click();
    assert.equal(await page.locator('#moisture').inputValue(),'');
    await page.getByRole('button',{name:'Continue to Storage'}).click();assert.ok(await page.locator('#product-step').isVisible());
    await page.locator('#custom-name').fill('Roasted Peanuts');await page.locator('#custom-type').selectOption('processed');
    await page.locator('#moisture').fill('3');await page.locator('#fat').fill('49');
    assert.equal(await page.locator('#respiration').inputValue(),'0');assert.ok(await page.locator('#respiration').isDisabled());
    await overflow(page,width+' custom product');
    await page.getByRole('button',{name:'Continue to Storage'}).click();
    await page.locator('#days').fill('180');await page.locator('#storage').selectOption('ambient');await page.locator('#temp').fill('25');await page.locator('#humidity').fill('60');await page.locator('#transport').selectOption('long');
    await generate(page);assert.match(await page.locator('#result-title').innerText(),/Roasted Peanuts/);assert.match(await page.locator('.recommendation-hero h2').innerText(),/Foil|Metallized/);assert.equal(await page.locator('.map-card').count(),0);
    await overflow(page,width+' custom processed results');
    await page.getByRole('button',{name:'Adjust inputs'}).click();await page.getByRole('button',{name:'Product details'}).click();assert.equal(await page.locator('#custom-name').inputValue(),'Roasted Peanuts');assert.equal(await page.locator('#fat').inputValue(),'49');
    await page.locator('#custom-name').fill('Fresh Guava');await page.locator('#custom-type').selectOption('fresh');
    await page.locator('#moisture').fill('81');await page.locator('#fat').fill('1');await page.locator('#ph-na').uncheck();await page.locator('#ph').fill('4.2');
    await page.getByRole('button',{name:'Continue to Storage'}).click();assert.ok(await page.locator('#product-step').isVisible());
    await page.locator('#respiration').selectOption('2');await page.getByRole('button',{name:'Continue to Storage'}).click();
    await page.locator('#days').fill('10');await page.locator('#storage').selectOption('chilled');await page.locator('#temp').fill('8');await page.locator('#humidity').fill('90');await page.locator('#transport').selectOption('medium');
    await generate(page);assert.match(await page.locator('#result-title').innerText(),/Fresh Guava/);assert.match(await page.locator('.recommendation-hero h2').innerText(),/Breathable|Micro-perforated/);
    const customMap=await page.locator('.map-card').innerText();assert.match(customMap,/Requires product-specific validation/);assert.ok(!/\d.*%/.test(customMap));assert.ok(!/Red Delicious|mature-green tomatoes/.test(customMap));
    await overflow(page,width+' custom fresh results');await page.screenshot({path:path.join(root,'test-output',width+'-custom-guava.png'),fullPage:true});
    checks.push(width+' custom processed/fresh, required values, back preservation and no numeric MAP');
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
