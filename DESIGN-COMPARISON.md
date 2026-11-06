# Eleven Forward design comparison

Branch: `codex/website-design-comparison`. Baseline artwork: `f4fe36c`, pushed to main. This branch is local design exploration and must not be merged or deployed automatically.

## Run

Use Node 22.13+ and installed package dependencies:

```
npm ci
npm run build:designs
npm run preview:designs
```

Open http://127.0.0.1:4175. Build output is ignored `dist-designs/`. Original production builds remain independent. Each source design has its own IMPLEMENTATION-PLAN.md; GPT-6.1 Sol agents authored On, Lulu, Nike, and Vuori.

## Architecture

The generator renders explicit prefixed routes. Native has its own snapshot of Shopify source and local Liquid renderer. Each new design exports home/collection/product/club render functions, consumes shared fixture data, and scopes CSS under its design root. Shared pages supply local search, account, checkout and cart demonstrations. The chooser uses screenshots captured from actual rendered pages. A sessionStorage cart follows the browser tab across variants. Forms never submit externally.

Native retains the original presentation script; Shopify commerce, engagement, and authentication scripts are excluded. Its product forms use the shared local controls. The design preview intentionally uses fixture prices and inventory, not live Shopify data. Policy pages retain current draft content.

## Validation

- Existing catalog tests: 9 passed; Shopify commerce/account tests: 48 passed.
- Shopify package built; Theme Check: zero issues.
- `npm run test:designs`: five suites verify complete route output and active styles.
- `node scripts/designs-qa.cjs`: local Chrome checks homepages at 320/390/768/1440, captures desktop/mobile screenshots, exercises all three product selections in every design, cart quantity/removal, search match/no-results, design switching with query retention, back/refresh and reduced motion.
- Responsive results: `review/designs/verification.json`; all 20 homepage checks have no horizontal overflow.
- QA script uses the installed Codex Playwright runtime and local Chrome. Adjust the require path for a different machine.

Browser checks are representative, not a full accessibility audit. Keyboard focus and reduced-motion styles are implemented; comprehensive screen-reader, contrast, production integration testing remain outside this local comparison verification.
