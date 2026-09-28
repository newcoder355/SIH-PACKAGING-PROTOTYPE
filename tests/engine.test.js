const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');
const {commodities} = require('../data.js');
const run = (id,changes={}) => E.recommend({...E.defaults(id),...changes});

test('all eight profiles yield ranked, finite, explained recommendations',()=>{
  for(const id of Object.keys(commodities)){
    const r=run(id);assert.ok(r.ranked.length>=2);assert.ok(r.best.score<=98 && r.best.score>0);
    assert.equal(r.best.id,r.ranked[0].id);assert.notEqual(r.best.id,r.alternative.id);
    assert.ok(r.reasons.length>=2 && r.reasons.length<=4);
    assert.ok(r.ranked.every((m,i,a)=>i===0||a[i-1].score>=m.score));
  }
});
test('tomatoes exchange gases while chips use high barriers',()=>{
  const tomato=run('tomato'),chips=run('chips');
  assert.equal(tomato.best.id,'micro');assert.ok(tomato.map);
  assert.equal(chips.best.id,'met');assert.equal(chips.map,null);
  assert.ok(chips.targets.oxygen>tomato.targets.oxygen);
});
test('powder uses foil; potato uses dark ventilation and avoids reduced oxygen',()=>{
  assert.equal(run('milk').best.id,'foil');
  const p=run('potato');assert.equal(p.best.id,'vent');assert.match(p.map.o2,/Ambient/);
});
test('humidity and shelf-life changes can change material ranking',()=>{
  const base=run('biscuits',{days:15,humidity:40,fat:5,transport:'local'});
  const demanding=run('biscuits',{days:365,humidity:90,fat:25,transport:'rough'});
  assert.notEqual(base.best.id,demanding.best.id);
  assert.ok(demanding.targets.oxygen>base.targets.oxygen);
  assert.ok(demanding.targets.water>base.targets.water);
  assert.notDeepEqual(base.reasons,demanding.reasons);
});
test('respiration and warm temperature increase ventilation requirements',()=>{
  const low=run('apple'),high=run('apple',{respiration:3,temp:25,storage:'ambient'});
  assert.ok(high.targets.gas>low.targets.gas);assert.notEqual(low.best.id,high.best.id);
});
test('rough distribution increases strength and illustrative thickness',()=>{
  const a=run('tomato'),b=run('tomato',{transport:'rough'});
  assert.ok(b.targets.strength>a.targets.strength);assert.ok(b.thickness[0]>a.thickness[0]);
});
test('frozen produce excludes breathing films and MAP and flags processing',()=>{
  const r=run('tomato',{storage:'frozen',temp:-18});
  assert.ok(r.best.cold);assert.equal(r.map,null);assert.ok(!r.best.fresh);
  assert.match(r.notes.join(' '),/processed\/frozen/);
});
test('acidity, tomato chilling and ambitious shelf life surface review notes',()=>{
  assert.match(run('tomato',{temp:4,days:90}).notes.join(' '),/chilling injury/);
  assert.match(run('tomato').notes.join(' '),/food-contact/);
  assert.match(run('apple',{days:730}).notes.join(' '),/Feasibility is unverified/);
});
test('invalid composition, nonfinite values and incompatible temperatures rejected',()=>{
  for(const change of [{fat:90,moisture:90},{days:0},{temp:NaN},{humidity:101},{storage:'frozen',temp:20},{ph:15},{respiration:0}]) assert.throws(()=>run('tomato',change));
});
