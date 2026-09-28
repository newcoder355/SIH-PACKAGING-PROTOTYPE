(function (root) {
  const data = root.PackWiseData || require('./data.js');
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const levels = ['', 'Low', 'Moderate', 'High', 'Very high', 'Very high'];
  function defaults(id) {return {commodity:id, ...(id==='custom'?data.customProfile:data.commodities[id])};}
  function profile(p) {
    return p.commodity==='custom'
      ? {...data.customProfile,name:p.customName.trim(),fresh:p.productType==='fresh'}
      : data.commodities[p.commodity];
  }
  function validate(p) {
    if (p.commodity!=='custom' && !data.commodities[p.commodity]) throw new Error('Choose a supported commodity.');
    if (p.commodity==='custom') {
      if (typeof p.customName!=='string' || !p.customName.trim() || p.customName.trim().length>60) throw new Error('Enter a food name of 1–60 characters.');
      if (!['fresh','processed'].includes(p.productType)) throw new Error('Choose a product type.');
      if (p.moisture+p.fat>100) throw new Error('Moisture and fat together cannot exceed 100% by mass.');
      if (p.productType==='processed' && p.respiration!==0) throw new Error('Processed foods must use Not applicable for respiration.');
    }
    for (const [key,min,max] of [['moisture',0,100],['fat',0,100],['days',1,730],['temp',-30,50],['humidity',0,100]]) {
      if (typeof p[key] !== 'number' || !Number.isFinite(p[key]) || p[key]<min || p[key]>max) throw new Error('Please enter a valid '+key+' value.');
    }
    if (p.moisture+p.fat>100.01) throw new Error('Moisture and fat together cannot exceed 100% by mass.');
    if (p.ph!==null && (!Number.isFinite(p.ph) || p.ph<0 || p.ph>14)) throw new Error('pH must be between 0 and 14, or not applicable.');
    if (!['ambient','chilled','frozen'].includes(p.storage) || !['local','medium','long','rough'].includes(p.transport)) throw new Error('Choose valid storage and transport options.');
    if (![0,1,2,3].includes(p.respiration) || (profile(p).fresh && p.respiration===0)) throw new Error('Choose a respiration level for fresh produce.');
    if (p.storage==='frozen' && p.temp>0) throw new Error('Frozen storage requires a temperature at or below 0°C.');
    if (p.storage==='chilled' && (p.temp<0 || p.temp>15)) throw new Error('For this demo, chilled storage is 0–15°C.');
    if (p.storage==='ambient' && p.temp<5) throw new Error('For this demo, ambient storage must be at least 5°C.');
  }
  function recommend(p) {
    validate(p);
    const c=profile(p), frozen=p.storage==='frozen', fresh=c.fresh&&!frozen;
    const crispy=['chips','biscuits'].includes(p.commodity), powder=p.commodity==='milk';
    const stress={local:1,medium:2,long:3,rough:4}[p.transport];
    let water=fresh?2:(crispy||powder||(p.commodity==='custom'&&p.moisture<=10)?4:p.moisture>60?4:3);
    let oxygen=fresh?1:(p.fat>=20?4:p.fat>=5?3:1);
    if (!fresh && p.days>120) {water++;oxygen++;}
    if (!fresh && p.humidity>75) water++;
    if (!fresh && p.temp>30) oxygen++;
    if (!fresh && p.days<=30 && !powder) oxygen=Math.max(1,oxygen-1);
    water=clamp(water,1,5);oxygen=clamp(oxygen,1,5);
    const gas=fresh?(p.commodity==='potato'?5:clamp(p.respiration+2+(p.temp>20?1:0),3,5)):0;
    const strength=clamp(1+stress+(frozen?1:0),2,5);
    const light=p.commodity==='potato'?4:p.commodity==='oil'?5:p.fat>=20?4:1;
    const grease=p.fat>=20?5:p.fat>=5?3:1;
    const targets={water,oxygen,gas,strength,light,grease,seal:4};
    const weights=fresh?{water:1,oxygen:0,gas:5,strength:2,light:p.commodity==='potato'?4:0,grease:0,seal:1}:{water:4,oxygen:3,gas:0,strength:2,light:light>1?2:0,grease:2,seal:2};
    const ranked=data.materials.filter(m=>fresh?m.fresh:!m.fresh).filter(m=>!frozen||m.cold).map(m=>{
      let deficit=0,total=0,excess=0;
      for(const key of Object.keys(weights)) {
        const w=weights[key];total+=w;
        deficit+=(key==='gas'?Math.abs(m[key]-targets[key]):Math.max(0,targets[key]-m[key]))/4*w;
        if(key!=='gas') excess+=Math.max(0,m[key]-targets[key])*w;
      }
      const score=clamp(Math.round(100-100*deficit/total-m.complexity*1.5-excess*.32),1,98);
      return {...m,score};
    }).sort((a,b)=>b.score-a.score||a.complexity-b.complexity);
    const best=ranked[0], alternative=ranked[1];
    const eco=ranked.filter(m=>m.id!==best.id && m.eco>=3).sort((a,b)=>(b.score+b.eco*2)-(a.score+a.eco*2))[0] || best;
    const reasons=[];
    if(fresh) reasons.push(`${c.name} continues to respire after harvest. ${['','Low','Medium','High'][p.respiration]} respiration at ${p.temp}°C calls for ${gas>=4?'increased ventilation':'controlled gas exchange'}, rather than a gas-tight barrier.`);
    else if(crispy) reasons.push(`${c.name} at ${p.moisture}% moisture needs a strong moisture barrier and reliable seals to protect crispness.`);
    else if(powder) reasons.push(`Milk powder is moisture-sensitive. A ${levels[water].toLowerCase()} moisture barrier helps limit moisture pickup and clumping.`);
    else if(p.commodity==='rice') reasons.push(`Dried rice needs protection from humid air and package damage. At ${p.fat}% fat, oxygen protection has ${oxygen<=2?'lower':'increased'} priority.`);
    else if(p.commodity==='custom') reasons.push(`${c.name} has ${p.moisture}% moisture. ${p.moisture>60?'High moisture calls for appropriate moisture control.':p.moisture<=10?'Low moisture makes protection against moisture pickup important.':'The package needs appropriate moisture protection.'} These properties set a ${levels[water].toLowerCase()} moisture barrier target.`);
    else reasons.push(`Cooking oil at ${p.fat}% fat needs oxygen and light protection to limit oxidation, plus a grease-resistant food-contact layer.`);
    if(fresh) reasons.push(p.commodity==='potato'?'Potatoes need darkness and airflow. An opaque ventilated pack is preferred; reduced-oxygen MAP is not a priority.':`At ${p.moisture}% product moisture and ${p.humidity}% surrounding humidity, balance moisture retention with ventilation to manage condensation.`);
    else reasons.push(`The ${p.days}-day shelf-life target at ${p.temp}°C and ${p.humidity}% RH sets a ${levels[water].toLowerCase()} moisture and ${levels[oxygen].toLowerCase()} oxygen barrier requirement. This is a design target, not a shelf-life prediction.`);
    if(!fresh && p.fat>=5 && p.commodity!=='oil') reasons.push(`${p.commodity==='custom'?c.name+' contains '+p.fat+'% fat; this':p.fat+'% fat'} increases the need for oxidation and grease protection${light>=4?', including light shielding':''}.`);
    reasons.push(frozen?'Frozen storage prioritizes a cold-tolerant sealant and resistance to punctures and freezer moisture loss.':stress>=3?`${p.transport==='rough'?'Rough handling':'Long-distance transport'} increases the need for puncture resistance, robust seals and a protective outer carton.`:fresh&&p.storage==='chilled'?`Controlled chilled storage at ${p.temp}°C supports slower respiration; maintain the cold chain and use a protective produce tray.`:'A well-formed seal and a suitable outer pack help protect the product during distribution.');
    const notes=[];
    if(p.commodity==='custom') notes.push('Custom food: property-driven heuristic screening only. Product-specific processing, microbial safety, storage suitability and shelf life require validation.');
    if(c.fresh&&frozen) notes.push('Frozen mode assumes a processed/frozen product. Freezing damages whole fresh-produce texture; fresh-produce MAP is disabled. Processing suitability must be established separately.');
    if(p.commodity==='tomato'&&!frozen&&p.temp<10) notes.push('This mature-green tomato profile is vulnerable to chilling injury at low temperatures. Review ripeness and storage temperature before trials.');
    if(fresh && p.temp>20) notes.push('Warm storage increases respiration and spoilage pressure. Packaging cannot replace appropriate temperature control.');
    if(fresh && p.days>(p.commodity==='apple'?45:21)) notes.push('The requested fresh-produce shelf life exceeds this demonstration’s screening window. Feasibility is unverified; the score does not validate shelf life.');
    if(p.ph!==null && p.ph<4.5) notes.push(`At pH ${p.ph}, specify a validated food-contact polymer layer; exposed aluminium must not contact acidic food. Migration and compatibility testing remain necessary.`);
    if(p.moisture>15&&!c.fresh&&p.commodity!=='oil'&&p.commodity!=='custom') notes.push('Edited moisture is high for this dry-food profile. Review drying and microbial stability; moisture percentage does not determine water activity or safety.');
    if(p.humidity>85 && !fresh) notes.push('High ambient humidity increases moisture ingress risk, especially through imperfect seals.');
    if(frozen&&p.temp>-18) notes.push('This temperature is warmer than the typical −18°C frozen-chain reference. Validate the intended cold chain.');
    const gaps=Object.keys(weights).filter(k=>weights[k] && k!=='gas' && best[k]<targets[k]);
    if(gaps.length) notes.push('Additional protection is needed for: '+gaps.map(k=>({water:'moisture barrier',oxygen:'oxygen barrier',strength:'mechanical strength',light:'light shielding',grease:'grease resistance',seal:'seal integrity'}[k])).join(', ')+'. Check the supplier grade and secondary packaging.');
    const thickness=best.thickness.map(n=>n+(stress>=3?20:0));
    return {input:{...p},commodity:c,best,alternative,eco,ranked,targets,weights,reasons:reasons.slice(0,4),notes,fresh,frozen,thickness,
      map: fresh?(p.commodity==='custom'?{suitability:'Requires product-specific validation',custom:true,note:'MAP may be suitable, but gas composition must be determined experimentally using commodity respiration rate, package size, film area, permeability and storage temperature.'}:p.commodity==='potato'?{suitability:'Not a primary requirement',o2:'Ambient air (~21%)',co2:'Ambient air (~0.04%)',note:'Prefer ventilation and darkness. These are ambient-air references, not a low-oxygen MAP recipe.'}:p.commodity==='tomato'?{suitability:'Candidate for validated trials',o2:'3–5%',co2:'0–3%',note:'Illustrative controlled-atmosphere references for mature-green tomatoes. Passive MAP must be engineered for pack size, maturity, temperature and respiration.'}:{suitability:'Cultivar-specific trials',o2:'1–2%',co2:'2–4%',note:'Red Delicious controlled-atmosphere references only; do not generalize to other apple cultivars or directly use as a gas-flush recipe.'}):null};
  }
  const api={defaults,validate,recommend};root.PackWiseEngine=api;
  if(typeof module!=='undefined') module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
