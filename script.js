'use strict';
const $ = id => document.getElementById(id);
const {commodities, materials, customProfile} = PackWiseData;
let state = PackWiseEngine.defaults('tomato');
let lastResult = null;
let analyzing = false;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const displayLevel = n => ['','Low','Moderate','High','Very high','Very high'][n];
const transmission = n => ['','High','Medium','Low','Very low','Very low'][n];

$('commodity-grid').innerHTML = Object.entries({...commodities,custom:customProfile}).map(([id,c])=>`<div class="commodity-option"><input type="radio" name="commodity" id="commodity-${id}" value="${id}"><label for="commodity-${id}">${c.name}</label></div>`).join('');

function show(view) {
  $('home').hidden=view!=='home';$('workspace').hidden=view==='home';
  for (const name of ['product','storage','analysis','result']) $(name+'-step').hidden=name!==view;
  const index={product:0,storage:1,analysis:2,result:2}[view];
  ['product','storage','result'].forEach((name,i)=>{const item=$('progress-'+name);item.className=i===index?'active':i<index?'done':'';if(i===index)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');});
  window.scrollTo({top:0,behavior:'instant'});
  const heading=$(view==='home'?'home-title':view+'-title');if(heading)heading.focus({preventScroll:true});
}
function updatePh() { $('ph').disabled=$('ph-na').checked; }
function fillProduct() {
  const custom=state.commodity==='custom';
  $('custom-fields').hidden=!custom;$('custom-fields').disabled=!custom;
  $('custom-name').value=state.customName||'';$('custom-type').value=state.productType||'';
  $('profile-badge').textContent=custom?'Manual food properties':'Editable demo values';
  $('commodity-'+state.commodity).checked=true;
  for(const key of ['moisture','fat','ph','respiration']) $(key).value=state[key]??'';
  $('ph-na').checked=state.ph===null;updatePh();
  $('respiration').disabled=!state.fresh;
  $('respiration').querySelector('option[value="0"]').disabled=state.fresh;
  $('respiration-hint').textContent=state.fresh?'Relative demo category, not a measured rate.':'Processed foods do not need a produce-respiration input.';
  $('product-insight-title').textContent=state.name;
  $('product-insight').textContent=state.note;
  $('product-error').hidden=true;
}
function fillStorage(){for(const key of ['days','temp','humidity','storage','transport'])$(key).value=state[key];$('storage-product').textContent=state.name;$('storage-error').hidden=true;$('storage-hint').textContent='Choose the intended temperature regime.';}
function readNumber(key){return $(key).value.trim()===''?NaN:Number($(key).value);}
function error(form,message){$(form+'-error').textContent=message;$(form+'-error').hidden=false;}
function validInputs(form){const controls=[...$(form+'-form').querySelectorAll('input:not(:disabled),select:not(:disabled)')];const bad=controls.find(el=>!el.checkValidity());if(bad){bad.reportValidity();error(form,'Please check the highlighted field and enter a value within its range.');return false;}return true;}
function readProduct(){if(!validInputs('product'))return false;const product={...(state.commodity==='custom'?{customName:$('custom-name').value.trim(),productType:$('custom-type').value}:{}),moisture:readNumber('moisture'),fat:readNumber('fat'),ph:$('ph-na').checked?null:readNumber('ph'),respiration:state.fresh?Number($('respiration').value):0};try{PackWiseEngine.validate({...PackWiseEngine.defaults(state.commodity),...product});state={...state,...product};if(state.commodity==='custom')state.name=product.customName;$('product-error').hidden=true;return true;}catch(e){error('product',e.message);return false;}}

$('commodity-grid').addEventListener('change',e=>{if(e.target.name==='commodity'){state=PackWiseEngine.defaults(e.target.value);fillProduct();}});
$('custom-type').addEventListener('change',()=>{
  state.productType=$('custom-type').value;state.fresh=state.productType==='fresh';
  $('respiration').disabled=!state.fresh;
  $('respiration').querySelector('option[value="0"]').disabled=state.fresh;
  $('respiration').value=state.fresh?'':'0';
  $('respiration-hint').textContent=state.fresh?'Choose a relative respiration level for this produce.':'Processed foods do not need a produce-respiration input.';
});
$('ph-na').addEventListener('change',updatePh);
$('start').addEventListener('click',()=>show('product'));
$('back-home').addEventListener('click',()=>show('home'));
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();if(!analyzing)show('home');});
$('product-form').addEventListener('submit',e=>{e.preventDefault();if(readProduct()){fillStorage();show('storage');}});
$('back-product').addEventListener('click',()=>{for(const key of ['days','temp','humidity']){const value=readNumber(key);if(Number.isFinite(value))state[key]=value;}state.storage=$('storage').value;state.transport=$('transport').value;fillProduct();show('product');});
$('storage').addEventListener('change',()=>{const type=$('storage').value;$('temp').value={ambient:25,chilled:state.commodity==='tomato'?13:state.commodity==='potato'?12:4,frozen:-18}[type];$('storage-hint').textContent='Temperature updated for '+type+' storage. You can edit it.';});
$('storage-form').addEventListener('submit',async e=>{
  e.preventDefault();if(analyzing||!validInputs('storage'))return;
  const next={...state,days:readNumber('days'),temp:readNumber('temp'),humidity:readNumber('humidity'),storage:$('storage').value,transport:$('transport').value};
  try {lastResult=PackWiseEngine.recommend(next);state=next;}catch(err){error('storage',err.message);return;}
  analyzing=true;show('analysis');
  const messages=['Analyzing moisture sensitivity…','Evaluating oxygen barrier requirements…','Checking storage conditions…','Comparing packaging structures…','Finding sustainable alternatives…'];
  for(const message of messages){$('analysis-status').textContent=message;await new Promise(resolve=>setTimeout(resolve,320));}
  renderResult(lastResult);analyzing=false;show('result');
});
$('edit-inputs').addEventListener('click',()=>{fillStorage();show('storage');});
$('new-result').addEventListener('click',()=>{state=PackWiseEngine.defaults('tomato');lastResult=null;fillProduct();fillStorage();show('product');});
$('print-result').addEventListener('click',()=>window.print());

function renderResult(r){
  const {best,alternative,eco,targets:t,input:p}=r;
  const specs=[
    ['Oxygen transmission (OTR)',r.fresh?'Controlled exchange':transmission(t.oxygen),'Oxygen Transmission Rate: how easily oxygen passes through a film. Lower transmission means a stronger barrier.'],
    ['Water vapour transmission (WVTR)',r.fresh?'Balance retention / ventilation':transmission(t.water),'Water Vapour Transmission Rate: how easily water vapour passes through a film. Lower transmission means a stronger moisture barrier.'],
    ['Film thickness',r.thickness.join('–')+' µm','Illustrative total film thickness band only; package size and supplier grade are not modelled.'],
    ['Sealability','Reliable heat seal','Use a validated sealing window for the actual sealant, equipment and product.'],
    ['Gas permeability',r.fresh?(t.gas>=4?'High / perforation-tuned':'Controlled / selective'):'Low exchange','Perforation design and package geometry govern actual gas exchange.'],
    ['Mechanical strength',displayLevel(t.strength),'Primary film needs secondary packaging when transport demands exceed its capacity.'],
    ['MAP suitability',r.map?r.map.suitability:(r.frozen?'Not assessed in frozen mode':'Not the primary requirement'),'Modified Atmosphere Packaging changes headspace gas. Product-specific validation is required.']
  ];
  const ecoText=r.fresh?'Consider a food-contact, certified compostable breathable grade where suitable composting collection exists. Moisture control, sealing and strength may be lower; validate ventilation and pack life.'+(p.commodity==='potato'?' Add an opaque, ventilated outer pack to maintain darkness.':''):eco.id===best.id?'The leading option is also the strongest recycling-oriented candidate in this demo. Collection, labels, closures and local film-recycling infrastructure determine actual recyclability.':'A PE-based structure can simplify material recovery where film recycling exists. Oxygen and light protection may be lower than a laminate; the same shelf life is not established.';
  const ecoName=r.fresh?'Compostable Breathable Film':eco.name;
  const phText=p.ph===null?'pH: N/A':'pH '+p.ph;
  $('result-content').innerHTML=`
    <div class="result-heading"><div><span class="eyebrow">03 / YOUR PACKAGING DECISION</span><h1 id="result-title" tabindex="-1">Recommended Packaging${p.commodity==='custom'?' — '+esc(r.commodity.name):''}</h1><p>A material choice, the reasoning behind it, and what to validate next.</p></div><span class="result-reference">PACKWISE / MATERIAL EXPLORER</span></div>
    <div class="recommendation-hero"><div><span class="eyebrow">TOP-RANKED STRUCTURE · ${esc(r.commodity.name.toUpperCase())}</span><h2>${esc(best.name)}</h2><p>${esc(best.short)}</p></div><div class="score-box"><strong>${best.score}<span>/100</span></strong><span>Suitability Score</span><small>Rule-based fit · not ML confidence</small></div></div>
    <div class="result-summary"><span>${esc(r.commodity.name)}</span><span>${p.days}-day target</span><span>${esc(p.storage)} · ${p.temp}°C</span><span>${p.humidity}% RH</span><span>${esc({local:'Local transport',medium:'Medium distance',long:'Long distance',rough:'Rough handling'}[p.transport])}</span><span>Moisture ${p.moisture}% · fat ${p.fat}%</span><span>${phText}</span>${r.commodity.fresh?`<span>${['','Low','Medium','High'][p.respiration]} respiration</span>`:''}</div>
    <div class="results-grid"><article class="card why-card"><h2>Why this was recommended</h2><ol class="reason-list">${r.reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></article>
    <article class="card spec-card"><div class="card-heading"><h2>Packaging specifications</h2><span class="muted-badge">Target requirements</span></div><dl class="spec-list">${specs.map(([label,value,tip])=>`<div><dt><abbr class="info" title="${esc(tip)}" tabindex="0">${label}</abbr></dt><dd>${esc(value)}</dd></div>`).join('')}</dl><p class="spec-caption">Thickness is a predefined prototype band. Other entries describe target requirements, not measured material performance. OTR/WVTR numbers need stated test conditions and supplier data.</p></article></div>
    ${r.map?.custom?`<article class="card map-card"><div class="map-heading"><h2>Modified Atmosphere Packaging</h2><span class="muted-badge">${esc(r.map.suitability)}</span></div><p><strong>Suggested packaging:</strong> Breathable or micro-perforated film</p><p class="map-note"><strong>Atmosphere:</strong> ${esc(r.map.note)}</p><p class="map-footnote">No numerical O₂ / CO₂ targets are provided for an unknown commodity.</p></article>`:r.map?`<article class="card map-card"><div class="map-heading"><h2>Modified Atmosphere Packaging</h2><span class="muted-badge">${esc(r.map.suitability)}</span></div><div class="gas-grid"><div><span>O₂ · oxygen reference</span><strong>${esc(r.map.o2)}</strong></div><div><span>CO₂ · carbon dioxide reference</span><strong>${esc(r.map.co2)}</strong></div><div><span>Balance gas</span><strong>N₂</strong></div></div><p class="map-note">${esc(r.map.note)} ${p.commodity==='potato'?'Use an opaque ventilated bag.':'Use breathable or micro-perforated packaging; ongoing respiration changes the atmosphere inside the pack.'}</p><p class="map-footnote">Prototype recommendation ranges, not certified specifications. Controlled-atmosphere references do not directly specify a passive MAP package. Ambient air also contains trace gases.</p></article>`:''}
    <div class="alternative-grid"><article class="card alternative-card eco-card"><span class="eyebrow">ECO-FRIENDLY ALTERNATIVE</span><h3>${esc(ecoName)}</h3><p>${esc(ecoText)}</p></article><article class="card alternative-card"><span class="eyebrow">ALSO CONSIDER · ${alternative.score}/100 FIT</span><h3>${esc(alternative.name)}</h3><p>${esc(alternative.short)}. Ranked second against the same requirements; compare supplier performance and conversion needs before selecting.</p></article></div>
    ${r.notes.length?`<aside class="review-notes"><h3>Before a packaging trial</h3><ul>${r.notes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></aside>`:''}
    <details class="card transparency"><summary>How was this recommendation generated?</summary><p>This prototype compares your product’s moisture sensitivity, fat/oil content, oxygen sensitivity, respiration, storage temperature, humidity, shelf-life target and transportation stress with ${materials.length} illustrative material profiles. Fresh produce is screened for gas exchange; frozen products for cold-tolerant structures. pH adds food-contact compatibility guidance.</p><p>Materials use ordinal ratings from 1–5. The score starts at 100, subtracts weighted requirement shortfalls, then small complexity and excess-capacity penalties, and is capped at 98. Gas exchange uses distance from the target, so too much and too little exchange both count. Fresh-produce scoring prioritizes gas exchange; dry-food scoring prioritizes moisture and oxygen barriers. This is a heuristic ranking, not measured accuracy, safety approval or predicted shelf life.</p><table><thead><tr><th>Eligible structure</th><th>Suitability / 100</th></tr></thead><tbody>${r.ranked.map(m=>`<tr><td>${esc(m.name)}</td><td>${m.score}</td></tr>`).join('')}</tbody></table><p>Scientific context: <a href="https://postharvest.ucdavis.edu/produce-facts-sheets/tomato" target="_blank" rel="noopener noreferrer">UC Davis: tomato</a>, <a href="https://postharvest.ucdavis.edu/produce-facts-sheets/apple-red-delicious" target="_blank" rel="noopener noreferrer">Red Delicious apple</a>, <a href="https://postharvest.ucdavis.edu/produce-facts-sheets/potato" target="_blank" rel="noopener noreferrer">potato</a>; <a href="https://www.fao.org/4/x5016e/X5016E09.htm" target="_blank" rel="noopener noreferrer">FAO: produce packaging</a>. Demo defaults, material ratings, weights and thickness bands are unvalidated design assumptions; the sources do not validate this engine.</p></details>`;
}
fillProduct();fillStorage();
