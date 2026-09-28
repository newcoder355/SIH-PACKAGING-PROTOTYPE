# PackWise AI test report

Date: 28 September 2026 UTC / 29 September 2026 India.

## Engine

9/9 Node built-in tests passed. Covers all default profiles, fresh/processed distinction, powder/potato requirements, input-sensitive scoring, respiration, transport stress, frozen filtering, compatibility/storage review notes and invalid input rejection.

## Browser QA

Chromium via Playwright 1.51.1, GitHub-hosted runner. Run: https://github.com/newcoder355/SIH-PACKAGING-PROTOTYPE/actions/runs/36475096105

- 1440 × 1000 desktop, 390 × 844 mobile, 320 × 740 narrow mobile.
- Full Tomato and Chips flows at all three sizes; different main materials confirmed.
- Apple, Potato, Biscuits, Rice, Milk Powder and Cooking Oil flows at desktop.
- Changed transport updates explanations; changed apple respiration changes material.
- All screens and expanded comparison fit the viewport; no horizontal overflow.
- Back navigation, reset, invalid composition recovery and invalid storage recovery passed.
- Frozen produce mode excludes fresh MAP and returns cold-tolerant structures.
- Print button invokes browser printing; A4 PDF rendered.
- CSS applied; runtime files load; zero captured console, runtime or HTTP errors.
- 32 recorded successful checks. Screenshot/PDF/JSON evidence is in the run’s `browser-qa` artifact.
- Desktop landing and mobile Tomato result screenshots inspected visually: no overlap or clipping.

## Fixes

Product validation is isolated from a draft storage configuration so Back cannot trap the user after entering an inconsistent temperature. Storage helper text is reset between flows. Potato’s compostable alternative now explicitly requires an opaque ventilated outer pack.

## Live deployment verification — passed

The owner enabled GitHub Pages. Deployment run `36475689673`, attempt 2, succeeded, including all nine engine tests and all 32 browser checks against https://newcoder355.github.io/SIH-PACKAGING-PROTOTYPE/ . Job ID: `109123346907`.

The public page was also opened interactively in the cloud browser. Tomato and Chips flows, profile defaults, reset navigation and distinct recommendations were verified. The live Chips screenshot is saved at `docs/live-verified.jpg`.

No application errors were captured in automated live browser testing. The interactive cloud browser emitted extension metadata errors from its own `chrome-extension://` scripts; these were not application failures.

Mobile results are Chromium viewport tests, not physical iPhone/Safari tests. Product-specific engineering validation remains outside prototype scope.
