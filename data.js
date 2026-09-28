/* Illustrative commodity profiles and ordinal material ratings, not certified data. */
(function (root) {
  const commodities = {
    tomato: {name:'Tomato', category:'Fresh produce', symbol:'To', color:'tomato', fresh:true, moisture:94, fat:0.2, ph:4.3, respiration:2, days:10, temp:13, humidity:92, storage:'chilled', transport:'local', note:'Whole, mature-green tomatoes. Ripeness changes storage needs.'},
    apple: {name:'Apple', category:'Fresh produce', symbol:'Ap', color:'apple', fresh:true, moisture:85, fat:0.3, ph:3.8, respiration:1, days:30, temp:2, humidity:92, storage:'chilled', transport:'medium', note:'Whole apples; Red Delicious is the atmosphere-reference cultivar.'},
    potato: {name:'Potato', category:'Fresh produce', symbol:'Po', color:'potato', fresh:true, moisture:79, fat:0.1, ph:5.6, respiration:1, days:14, temp:12, humidity:90, storage:'chilled', transport:'medium', note:'Whole table potatoes. Keep dark and ventilated; not cut or processed potato.'},
    chips: {name:'Potato Chips', category:'Crispy snack', symbol:'Ch', color:'chips', fresh:false, moisture:2, fat:32, ph:null, respiration:0, days:90, temp:25, humidity:65, storage:'ambient', transport:'long', note:'Fried potato chips. Protect against moisture pickup and oil oxidation.'},
    biscuits: {name:'Biscuits', category:'Bakery', symbol:'Bi', color:'biscuits', fresh:false, moisture:4, fat:15, ph:null, respiration:0, days:60, temp:25, humidity:60, storage:'ambient', transport:'medium', note:'Dry biscuits. Crispness, reliable seals and crush protection matter.'},
    rice: {name:'Rice', category:'Dry grain', symbol:'Ri', color:'rice', fresh:false, moisture:12, fat:1, ph:null, respiration:0, days:90, temp:25, humidity:60, storage:'ambient', transport:'medium', note:'Dried, milled white rice. Brown rice would need stronger oxidation protection.'},
    milk: {name:'Milk Powder', category:'Dairy powder', symbol:'Mp', color:'milk', fresh:false, moisture:3, fat:26, ph:6.6, respiration:0, days:180, temp:25, humidity:60, storage:'ambient', transport:'long', note:'Whole milk powder. pH refers to reconstituted product; powder moisture is not water activity.'},
    oil: {name:'Cooking Oil', category:'Edible oil', symbol:'Oi', color:'oil', fresh:false, moisture:0.1, fat:99.9, ph:null, respiration:0, days:180, temp:25, humidity:60, storage:'ambient', transport:'medium', note:'Refined edible oil in a flexible retail pack. pH is not applicable to anhydrous oil.'}
  };
  // Capacities: 1 = low, 5 = very high. Gas describes exchange, not oxygen barrier.
  const materials = [
    {id:'ldpe',name:'LDPE Film',short:'Flexible moisture protection',water:3,oxygen:1,gas:2,strength:2,light:1,grease:2,seal:5,cold:true,eco:4,complexity:1,thickness:[50,100]},
    {id:'hdpe',name:'HDPE Film',short:'Tough grain and dry-food pack',water:4,oxygen:2,gas:1,strength:4,light:2,grease:3,seal:4,cold:true,eco:4,complexity:1,thickness:[60,120]},
    {id:'pet',name:'PET / PE Laminate',short:'Strong outer layer, sealable inner layer',water:3,oxygen:3,gas:1,strength:4,light:1,grease:4,seal:5,cold:true,eco:1,complexity:2,thickness:[60,110]},
    {id:'bopp',name:'Heat-sealable BOPP Film',short:'Crispness-focused snack wrap',water:4,oxygen:2,gas:1,strength:3,light:1,grease:4,seal:4,cold:false,eco:3,complexity:1,thickness:[30,50]},
    {id:'met',name:'PET / Metallized PET / PE Laminate',short:'Moisture, oxygen and light barrier',water:5,oxygen:4,gas:0,strength:4,light:5,grease:5,seal:5,cold:true,eco:1,complexity:3,thickness:[70,120]},
    {id:'foil',name:'PET / Aluminium Foil / PE Laminate',short:'Very high barrier for sensitive products',water:5,oxygen:5,gas:0,strength:4,light:5,grease:5,seal:5,cold:true,eco:1,complexity:4,thickness:[90,140]},
    {id:'breath',name:'Breathable Produce Film',short:'Selective exchange for living produce',water:2,oxygen:1,gas:3,strength:2,light:1,grease:1,seal:4,cold:false,eco:2,complexity:2,thickness:[25,45],fresh:true},
    {id:'micro',name:'Micro-perforated LDPE Film',short:'Controlled ventilation with moisture retention',water:2,oxygen:1,gas:4,strength:3,light:1,grease:2,seal:5,cold:false,eco:4,complexity:1,thickness:[30,60],fresh:true},
    {id:'bio',name:'Compostable Breathable Film',short:'Certified compostable-grade concept',water:1,oxygen:1,gas:3,strength:2,light:1,grease:2,seal:3,cold:false,eco:3,complexity:2,thickness:[30,60],fresh:true},
    {id:'mono',name:'Recyclable Mono-material PE',short:'PE-based moisture barrier structure',water:4,oxygen:2,gas:1,strength:4,light:2,grease:4,seal:5,cold:true,eco:5,complexity:1,thickness:[70,120]},
    {id:'vent',name:'Ventilated Opaque HDPE Bag',short:'Light screening with open ventilation',water:1,oxygen:1,gas:5,strength:4,light:4,grease:2,seal:4,cold:false,eco:4,complexity:1,thickness:[60,100],fresh:true}
  ];
  // Custom mode has no assumed food composition; storage remains editable in step 2.
  const customProfile = {name:'Custom Food', symbol:'+', color:'rice', fresh:false, customName:'', productType:'', moisture:null, fat:null, ph:null, respiration:0, days:30, temp:25, humidity:60, storage:'ambient', transport:'local', note:'Enter the properties of your food. Recommendations use generic property-driven rules, not a validated commodity profile.'};
  const data = {commodities, materials, customProfile};
  root.PackWiseData = data;
  if (typeof module !== 'undefined') module.exports = data;
})(typeof window !== 'undefined' ? window : globalThis);
