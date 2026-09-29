# SmartPack — judge demonstration

## 60–90 second script

“Different foods fail for different reasons. Tomatoes continue to respire after harvest, while chips lose crispness when they absorb moisture. One packaging material cannot serve every product equally well.

SmartPack brings the product and its journey into one recommendation flow. We select a commodity, review editable food properties, then enter the shelf-life target, temperature, humidity and transport conditions.

For these tomatoes, the prototype selects micro-perforated LDPE because the package must allow gas exchange while limiting moisture loss. It explains the choice, shows target packaging requirements, and presents qualified atmosphere references for future validation.

Now we switch to chips. The recommendation changes to a metallized laminate because moisture, oxygen and light protection matter more than breathability. Milk powder shows a third case: a foil laminate for very high barrier needs.

Each result includes an alternative, sustainability trade-offs and a transparent suitability score. Today, the engine is rule-based and uses illustrative material data; it is not a trained model or a shelf-life guarantee. Our full-system plan adds validated packaging data, ML recommendations, shelf-life prediction and cost optimization, supported by product testing.”

## Best live examples

| Product | Inputs | Expected main output |
|---|---|---|
| Tomato | Defaults: 94% moisture, 0.2% fat, pH 4.3, medium respiration, 10 days, chilled 13°C, 92% RH, local transport | Micro-perforated LDPE; respiration and MAP section |
| Potato Chips | Defaults: 2% moisture, 32% fat, 90 days, ambient 25°C, 65% RH, long distance | PET / Metallized PET / PE; crispness and oxidation |
| Milk Powder | Defaults: 3% moisture, 26% fat, 180 days, ambient 25°C, 60% RH, long distance | PET / Aluminium Foil / PE; very high barrier needs |

For a quick change-in-input proof: choose Apple with defaults, generate, return to product details and change respiration from Low to High. The gas-exchange target and material ranking change. For strength: change Tomato transport from Local to Rough handling and compare reasons and thickness.

## What to say about the score

“This is the fit between our rule-derived requirements and illustrative material ratings. It is not ML confidence or guaranteed shelf life.”

## If asked about MAP

“The numbers are qualified controlled-atmosphere reference ranges, shown to explain the concept. Actual passive MAP design also needs produce variety and maturity, product mass, package area, temperature, respiration measurements and packaging trials. Potatoes use ventilation rather than a reduced-oxygen recipe.”
