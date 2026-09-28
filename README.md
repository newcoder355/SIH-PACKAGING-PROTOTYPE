# PackWise AI

**Intelligent Food Packaging Recommendation System** — a responsive, static decision-support prototype for a college/hackathon demonstration.

## Problem

Food products need different protection against moisture, oxygen, light and mechanical damage. Fresh produce also needs appropriate gas exchange. Inappropriate packaging can contribute to quality loss and waste; choosing a structure requires considering the product and its distribution conditions together.

## Prototype overview

PackWise AI demonstrates the workflow from commodity selection to an explained material recommendation. **It currently uses deterministic rule-based scoring and illustrative data, not a trained AI/ML model.** “AI” is project branding for the intended full system. No trained model, backend, database, authentication, payment or traceability service is present.

### Features

- Home → product properties → storage/distribution → short analysis → results wizard.
- Eight editable commodity profiles; applicable pH and fresh-produce respiration controls.
- Eleven packaging structures with ordinal material characteristics.
- Ranked primary and second-best materials with dynamic explanations.
- Target OTR/WVTR requirements, demo thickness bands, sealing, gas exchange, mechanical strength and MAP suitability.
- Qualified produce atmosphere references, recycling/compostability trade-offs, trial-review notes.
- Back/edit/reset controls, accessible keyboard navigation, mobile layout and browser print/save PDF.
- Entire runtime is local in the browser; no APIs, external fonts, trackers or CDN assets are required.

## Supported demo commodities

| Commodity | Profile assumption | Main emphasis |
|---|---|---|
| Tomato | Whole, mature-green | Micro-perforation, respiration, moisture retention |
| Apple | Whole; Red Delicious gas reference | Breathability, chilling, cultivar-specific atmosphere |
| Potato | Whole table potato | Ventilation and darkness, not reduced-oxygen MAP |
| Potato Chips | Fried snack | Crispness, moisture/oxygen/light barrier |
| Biscuits | Dry bakery snack | Moisture barrier, seal integrity, crush protection |
| Rice | Dried milled white rice | Moisture and mechanical protection |
| Milk Powder | Whole milk powder | Very high moisture and oxygen barriers |
| Cooking Oil | Refined oil in a flexible retail pack | Oxidation, light and grease resistance |

Changing the commodity resets its profile and storage defaults. Oil pH is not applicable. Dry-food pH defaults to not measured except milk powder, where the value refers to reconstituted product. Respiration is qualitative, not a measured rate.

## How the current engine works

1. Validate composition, numerical ranges, storage consistency and required inputs.
2. Derive ordinal requirements (1–5) for moisture barrier, oxygen barrier, gas exchange, mechanical strength, light shielding, grease resistance and sealability.
3. High fat raises oxygen/grease protection; long shelf life, warm conditions and high humidity raise relevant barriers. Transport stress increases strength and the demo thickness band. Fresh-produce respiration and warm storage increase gas-exchange needs.
4. Filter to breathing structures for unfrozen fresh produce, non-breathing structures for other products, and cold-tolerant structures for frozen products. Frozen produce is explicitly treated as a processed/frozen scenario, not preserved fresh texture.
5. Rank eligible materials with a transparent weighted shortfall score. For requirement `k`, shortfall is `max(0, target[k] - capacity[k]) / 4`; gas exchange instead uses `abs(target[k] - capacity[k]) / 4`.

```
score = clamp(round(100 - 100 * weighted_shortfall / sum(weights)
                    - 1.5 * complexity - 0.32 * weighted_excess_capacity), 1, 98)
```

Fresh-produce weights: gas exchange 5, strength 2, moisture 1, seals 1, light 4 only for potato. Other weights are zero. Non-fresh weights: moisture 4, oxygen 3, strength 2, grease 2, seals 2, light 2 if required. Exact rules and profile data are readable in `engine.js` and `data.js`.

6. Generate explanations from actual inputs, rank an alternative and identify a conditional sustainability option. Acidity adds food-contact-layer guidance rather than inventing an acid-barrier score. All laminate concepts presume a polymer contact layer, never exposed aluminium against acidic food.

**The score is a relative heuristic fit, not an ML confidence, safety approval, measured accuracy, or shelf-life guarantee.** A top-ranked material may still have shortfalls, displayed in trial-review notes. Complexity and excess-capacity penalties reduce unnecessary over-packaging; they are not cost or lifecycle models.

## Materials

LDPE; HDPE; PET/PE; heat-sealable BOPP; PET/metallized PET/PE; PET/aluminium foil/PE; breathable produce film; micro-perforated LDPE; compostable breathable film; recyclable mono-material PE; ventilated opaque HDPE.

All capacities and total-thickness bands are **unvalidated prototype assumptions**. No numerical OTR/WVTR measurements are claimed. Test conditions, layer ratios, package area, headspace, fill mass and perforation geometry are not modelled. Real recycling depends on collection infrastructure, contamination, additives and the complete package. Compostability requires a certified grade and a suitable collection/treatment system.

## Scientific context and provenance

Sources inform qualitative concepts and explicitly qualified produce atmosphere references; they do not validate this dataset or engine.

- [UC Davis — Tomato](https://postharvest.ucdavis.edu/produce-facts-sheets/tomato): mature-green storage/respiration and controlled-atmosphere context. Demo reference: O₂ 3–5%, CO₂ 0–3%.
- [UC Davis — Apple (Red Delicious)](https://postharvest.ucdavis.edu/produce-facts-sheets/apple-red-delicious): cultivar-specific O₂ 1–2%, CO₂ 2–4% controlled-atmosphere reference.
- [UC Davis — Potato](https://postharvest.ucdavis.edu/produce-facts-sheets/potato): limited benefit from modified atmospheres; avoid restricted oxygen. The UI shows ambient-air references, not a low-oxygen MAP recipe.
- [FAO — Retail packaging of fruits, vegetables and roots](https://www.fao.org/4/x5016e/X5016E09.htm): ventilation and produce packaging context.
- [FAO — Production facilities / packaging materials](https://www.fao.org/4/w6864e/w6864e0b.htm): comparative film-property context.

Accessed 28 September 2026. Composition defaults, ordinal respiration categories, thresholds, scoring weights and thickness ranges are illustrative design assumptions. **Controlled-atmosphere storage values cannot be directly converted into a passive MAP or gas-flushing specification.** Cultivar, maturity, microbial safety, temperature, pack mass, film area and gas flux must all be assessed experimentally.

## Technology and files

HTML, CSS and vanilla JavaScript. No runtime framework or build step.

```
index.html             Accessible screens and forms
styles.css             Responsive layout and print rules
data.js                Commodity and material data
engine.js              Validation, requirements and scoring
script.js              Wizard, animation and result rendering
tests/engine.test.js    Node built-in tests (development only)
.github/workflows/pages.yml  Test and GitHub Pages deployment
```

## Run locally

Open `index.html` directly in a modern browser, or run `python3 -m http.server 8000` in this directory and visit `http://localhost:8000`. Node is only needed for optional engine tests: `node --test tests/engine.test.js`.

GitHub Actions runs engine tests and assembles only the six static runtime files into a Pages artifact. If Pages is not enabled, a repository administrator must select **Settings → Pages → Source: GitHub Actions** once. Workflow configuration alone cannot override GitHub’s administrative permissions. See `PROGRESS.md` for the verified deployment status.

## Limitations

- No measured or trained model; no engineering optimization or live supplier database.
- No shelf-life prediction, cost calculation, food-safety assessment or regulatory approval.
- Moisture content is not water activity. Composition changes do not turn a dry-food category into a fully modelled different food.
- No quantitative respiration kinetics, OTR/WVTR calculation, perforation design, seal validation or freeze-processing model.
- No user accounts or saved history; refreshing the page resets inputs. Print saves a result locally.
- No guaranteed sustainable outcome; alternatives may sacrifice barrier performance.

## Planned full-system architecture — future only

The intended system can connect a validated commodity/packaging database to an AI/ML recommendation service and experimentally calibrated shelf-life models. An optimization layer could compare cost, shelf life, mechanical performance and lifecycle/sustainability constraints, including recyclable alternatives. Future APIs and a database could support supplier updates, saved trials and QR traceability. Industrial testing, food-contact/regulatory review, cold-chain trials and product-specific validation would precede production use. None of these future services is implemented in this prototype.

## Demo

1. Tomato: keep defaults (10 days, 13°C, 92% RH, chilled, local). Show micro-perforated LDPE, respiration reasoning and qualified MAP references.
2. Chips: keep defaults (90 days, 25°C, 65% RH, long distance). Show metallized laminate, crispness and oxidation requirements.
3. Milk powder: keep defaults (180 days, 25°C, 60% RH, long distance). Show foil laminate and very high moisture/oxygen protection.

For an interactive change, increase apple respiration from Low to High, or compare biscuits at 15 days / 40% RH / 5% fat / local transport with 365 days / 90% RH / 25% fat / rough handling.
