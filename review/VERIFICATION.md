# Verification — October 19, 2026

## Completed

- Static build generated all five requested page types, metadata, favicon, social image, robots, sitemap, and Cloudflare security headers.
- All local image/link targets, page anchors, and duplicate-ID checks passed.
- Email uses native type=email and required. Consent is required and initially unchecked. Review fieldset is disabled in HTML as well as JavaScript.
- Ten isolated signup behavior tests passed: review mode, invalid-form block, confirmed provider success, duplicate pending clicks, provider rejection, HTTP error, network error, malformed JSON, nonboolean success rejection, timeout.
- Confirmed missing launch inputs cause build failure when enabling signup.
- Browser rendered at 375, 768, 1280, and 1440 CSS pixels: document width equals viewport width at every size. No broken completed image loads found.
- Reviewed desktop/mobile hero, founder crop, logo meaning, shirt concept, signup, and Privacy Policy in the in-app browser.
- Mobile menu opens, Escape closes it, and focus returns to the menu button.
- Signup CTA navigates to the form; policy links open the correct draft routes.
- No third-party browser resources are needed to display the site. Fonts are local.
- No health fields or analytics added.

## Not yet verified

- Real Web3Forms submission, receiving-inbox delivery, provider filtering, and configured-domain behavior: no key or test email supplied.
- Cloudflare production headers, custom-domain HTTPS, hostname redirects, real unknown-URL handling, and rollback: no deployment performed.
- Approved policy language, retention, business identity, public contact inbox: owner inputs pending.
- Safari/Firefox/mobile device browser checks, actual 200% browser zoom, automated accessibility audit, and measured mobile Lighthouse score: not run. Four viewport checks do not replace these checks.
- JavaScript-disabled native submission: reviewed markup/fallback paths only; no actual external submission performed. Review controls remain disabled in native HTML.

The local preview server is temporary. See README for restarting it. Screenshots document reviewed states; they do not prove production delivery or legal approval.

## Copy simplification revision

Removed the redundant product-introduction section, shortened hero/founder/signup copy, reduced logo meaning to three lines, removed mission/club filler and repeated footer tagline, and renumbered sections. Reviewed updated desktop (1280px) and mobile (375px) layouts with no horizontal overflow. All ten existing signup tests and static link/consent checks passed again. Both open preview tabs were refreshed. Signup remains disabled and site unpublished.

## Product carousel and modal revision

The site now uses the owner-approved transparent founder image. Added three merchandise slides and a multi-select product-interest dialog (P001 first; CTA/current-slide default). Existing link/consent checks pass. Seventeen automated tests cover submission/error behavior, carousel wraparound and visibility, keyboard/swipe navigation, modal defaults, multiple choices, focus restoration, selected-product payload, and empty-selection validation. Transparent alpha and image paths checked.

Browser QA for this revision was blocked by the browser tool URL security policy (protocol not allowed when selecting the existing preview tab). No workaround was attempted. Current screenshots predate this revision; desktop/mobile rendering, native dialog focus trapping/Escape, and real device swipe still require visual verification. Real Web3Forms delivery and launch remain pending the existing owner inputs.

## Carousel styling, automatic rotation, and footer-product revision

Completed local browser QA using the in-app browser at 880×905 and 375×812. The earlier browser access limitation did not recur.

- Confirmed styled controls load from content-versioned CSS; 10px counter, thin rules, slide indicators, arrows, Pause/Play. No horizontal overflow at either inspected width.
- Observed six-second autoplay advance from black to white tee; confirmed manual Next navigation. Unit tests cover timer reset, Pause/Play, hover/focus/visibility/modal pauses, and reduced-motion defaults.
- Confirmed carousel CTA selects the current product, P001 hero/nav defaults, multiple selections, Escape close, focus restoration, and mobile dialog focus containment. Mobile dialog width 337px and height 788px within a 375×812 viewport, with no horizontal overflow.
- Both footer and modal now offer P001, black tee, white tee, and cap. Every signup link opens the modal; mobile policy-page navigation was tested through to the home-page dialog.
- Tested enabled copies of the forms on an isolated local QA route. All submissions were intercepted locally with a fake key and local endpoint; no Web3Forms requests or emails were sent. Verified empty/malformed email and unchecked consent prevention, required product selection, multi-product success payload and confirmation, and recoverable rejection preserving email/products with retry enabled.
- Production review configuration remains disabled. Real inbox delivery, approved policies/contact details, and production deployment verification remain pending.
- All 20 automated interaction/submission tests and local link/consent/product/versioned-asset checks pass.

Current screenshots: `carousel-styled.jpg`, `interest-modal.jpg`, `interest-modal-mobile.jpg`, and `footer-products-mobile.jpg`. Older screenshots document earlier versions.

## Hero glow revision

Added a green/white rotating gradient masked to the existing hero product alpha and blurred on a separate decorative layer. Verified in the local browser at 1280×1000 and 375×812: no horizontal overflow, image loads, eight-second CSS animation progresses (different sampled angles), and no solid border/frame is added. Reduced-motion rule removes the animation; print hides the glow. Static link, consent, product, and versioned-asset checks pass. Screenshots: `hero-glow-desktop.jpg` and `hero-glow-mobile.jpg`.

## Hero glow removed

Removed the decorative glow layer and its CSS animation at the owner’s request. Restored the original hero product markup. The historical glow screenshots describe the previous version, not the current site. Static output rebuilt and local link/product/consent checks passed.

## Founder extension and panel fill

Added a right-side outpaint and changed the portrait viewport to fill its panel. Verified that the original foreground PNG is byte-identical to the approved existing image and that the outpaint is clipped beyond the source’s right edge. The generated face is not displayed. Inline SVG image references remain same-origin, compatible with existing image security policy. Existing local link, product-form, consent, and versioned-asset checks pass. Local browser preview failed to load (connection refused / blocked error-page protocol), so this revision’s visual crop is not browser-verified.

## Disable automatic popup on entry

Removed hash-triggered modal opening. Loading or refreshing the site at `#updates` leaves the modal closed. Click-triggered signup actions remain active. Added a regression test that supplies `#updates` on initialization and verifies opening occurs only after a click.

## Annotation fixes: portrait seam and combined carousel row

Replaced the hard right-edge clip with a gradient mask beginning behind the original portrait’s transparent edge. The original foreground image remains byte-identical. Local browser verification at the annotated 630×905 viewport confirms a continuous head/neck/shoulder edge.

Removed the separate figure-caption row. The current product name now sits beside the left paging indicators and updates for arrow, indicator, swipe, and automatic slide changes. Narrow mobile screens stack the label within that same control group. Checked 630px and 375px widths with no horizontal overflow. All 22 interaction/submission tests and static asset/form checks pass. Screenshots: `founder-seam-fixed.jpg` and `carousel-combined-row.jpg`.

## Founder loading optimization

Replaced two eager SVG PNG downloads (2,300,834 bytes total) with one responsive WebP: 18 KB / 42 KB / 77 KB / 142 KB variants, plus a 188 KB progressive JPEG fallback. The 375×812 local browser preview selects founder-portrait-768.webp, confirms the image is complete and has no horizontal overflow. This is approximately 98% less portrait transfer at the tested viewport (94% less even for the largest variant). Checked the continuous portrait and preserved framing visually; screenshot: founder-optimized-mobile.png. Added static checks for responsive candidates, lazy/async loading, dimensions, and image byte budgets. Static checks and all 22 interaction/submission tests pass. Sizes are measured on disk; real mobile network timings were not measured.

## Separate Survival Club page

Moved the collection section from the homepage to /survival-club/, with its own h1, title, description, canonical URL and sitemap entry. Updated shared navigation on every page. The collection retains its carousel, signup section and shared modal; the first collection image loads eagerly. Homepage keeps P001, mission, founder, mark and signup. Local mobile verification at 375×812 confirms no horizontal overflow, carousel navigation, modal opening and correct white-tee preselection. Modal remains closed on arrival and signup remains disabled under existing launch safeguards. Static link/route checks and all 22 interaction/submission tests pass. Screenshot: survival-club-page-mobile.png.

## Scroll-animated Mark of the Survivors

Implemented a three-stage native SVG story: upward reveal with 11, schematic 11° guide, and sequential lift/settle of the two forms. The final path geometry matches the existing logo, and shared logo/favicon artwork is unchanged. Scroll position drives frames in either direction; no video, library, audio or external requests were added. Static markup is complete without application JavaScript, and reduced-motion settings remove enhancement and show the final mark.

Verified locally at 375×812, 768×1024 and 1440×1000: sticky-stage clearance, text readability, no horizontal overflow, resizing, reverse scrolling, and direct entry via #mark-title. The mobile stage remains below the navigation. Checked the no-application-JavaScript fallback in an isolated local copy: all three paragraphs and complete mark remain present, with no sticky enhancement. Reduced-motion initial/toggle behavior is covered by deterministic tests; OS-level reduced-motion emulation was not available in this browser tool. Confirmed the homepage signup modal still opens and preselects P001.

All 27 tests pass, including five focused tests for frame stages, reverse scrubbing, batched updates, offscreen/hidden-tab inactivity, reduced motion and mobile activation. Static site checks pass. Screenshots: mark-motion-desktop.png and mark-motion-mobile.png.

## Delayed first explanation

The logo now completes its entrance as the brand section fills the viewport beneath the navigation. The first heading and paragraph remain visually hidden until that threshold, then slide upward by 24px and fade in over the next 12% of viewport-height scrolling. Reversing the scroll reverses the entrance. Reduced-motion and no-JavaScript versions retain visible static copy. Verified desktop and mobile threshold/entrance in the local browser with no overflow. All 28 tests pass, including the new threshold and reverse/reduced-motion regression check. Screenshots: mark-intro-logo-first.png and mark-intro-text-entered.png.

## Blueprint guides and Better things ahead

Extended the story to four scroll stages. The new third passage keeps both schematic angle annotations visible while a green arrow draws upward and right. The final stage is titled Always Next Step Forward, fades the annotations/arrow, and lifts the original two paths in sequence. Original icon path geometry is asserted unchanged. The first logo entrance and delayed paragraph threshold are preserved.

Removed literal/encoded em dashes from deployed HTML, SVG, scripts and styles, including metadata, product labels and form subjects. Product colors now use parentheses; page titles use vertical bars; email subjects use colons. Historical documentation and original assets are preserved.

All 29 automated tests and static checks pass. Browser reviewed at 375×812, 768×1024 and 1440×1000, with no horizontal overflow. Confirmed guides persist during Better things ahead, disappear for the final stage, and restore when scrolling backward. Corrected mobile caption spacing so the concept label stays above the scroll hint. Checked final-heading wrapping and unchanged homepage modal/P001 preselection. An isolated no-application-JavaScript copy renders all four explanations and the complete logo. Reduced-motion initial and live-toggle behavior are covered by automated tests; OS-level emulation was not available in the browser tool. Screenshots: blueprint-journey-desktop.png and blueprint-journey-mobile.png.


## Annotated blueprint drawing and hero heading

Aligned the dotted guides to the owner’s annotated image: verticals through both upper-left corners, extended diagonal edge references, retained baseline, and both angle arcs/labels above the forms. Original logo paths are unchanged. Expanded the SVG viewBox to contain the upper annotations. Independent stroke masks draw diagonals during the first 40% of the angle stage, references during the next 35%, and arcs during the final 25% as labels fade in. Guide dots keep their spacing; reverse scroll reverses drawing, and a stationary frame holds. The completed guides remain through Better things ahead and fade during the final stepping passage.

Changed the homepage hero heading and page/social title to Join the Movement at the owner’s request. The mobile heading fits without overflow.

All 30 automated tests and static checks pass, including phased mask progression, reverse drawing, stationary resize, existing reduced-motion initial/toggle behavior, offscreen inactivity, modal and signup tests. Browser-reviewed at 375×812, 768×1024 and 1440×1000: no horizontal overflow, labels stay clear of navigation, partial mask drawing is visible, reverse scroll restores earlier phases, and completed guides persist with the journey arrow. The homepage signup popup opens with P001 selected; review-mode submission remains disabled. A separate copy without the application script shows the full logo and all four paragraphs without sticky enhancement. OS-level reduced-motion emulation was unavailable; its behavior is covered by automated tests. Screenshots: blueprint-draw-desktop.png, blueprint-draw-tablet.png, blueprint-draw-mobile.png and join-movement-mobile.png.

## P001 product story, Mission and neutral founder

Added a branded transparent P001 concept with fabric-integrated gray Eleven Forward branding on the top elastic. The sports-bra reference was used only for the integrated branding finish. Generated image dimensions remain 1672×941. The layout, wordmark spelling, piping, pouch and mesh were visually checked against the source; generated texture is not pixel-identical. Mesh, top and bottom details are crops of this same render. The neutral founder lighting edit was visually compared for identity/expression/pose/framing and removes the green rim/cast; prior approved originals remain available. Facial pixels are not identical after the lighting edit.

P001 has three native scroll moments and four image views, text transitions, a persistent signup action and concept caption. It reverses with scrolling and holds its last ready view until a requested detail decodes. Mission reveals three lines and its rule, completing at mid-screen. Founder uses a neutral portrait, small entrance movement and a separate text-side gradient that does not overlay the face. Section 03 shares the same frame scheduler but retains its prior progress mapping and four-stage behavior. No animation libraries, video or external requests were introduced.

All 35 tests and static checks pass. New tests cover synchronized product frames, decode delays/resumption without new scrolling, reverse progression, reduced-motion/short-screen restoration, Mission completion, founder light exit and shared frame batching. Existing modal, carousel, signup and logo-story checks remain passing. Browser reviewed at 375×812, 768×1024 and 1440×1000 with no horizontal overflow. Checked mesh and elastic views, reverse/rapid scroll, resizing/restored position, sticky clearance, neutral portrait, Mission final color and P001 modal preselection. No browser errors or warnings were recorded. At 720×500 the story becomes static and all three messages become accessible, also covering the CSS viewport equivalent of 200% zoom from 1440×1000. Actual browser zoom and OS-level reduced-motion emulation were unavailable; reduced motion is covered by deterministic tests. A separate copy without the application script exposes all three messages and all four images in normal flow. Network latency itself was not throttled; delayed decoding is tested with controlled promises.

Selected 375px mobile hero is `product-woven-640.webp` (approximately 38 KB); detail variants are 17–47 KB and founder 768px is approximately 39 KB. Sizes are measured on disk, not mobile network timings. Submission remains disabled pending launch prerequisites; no real signup was sent. Source masters and historical documentation remain preserved.

### Product magnifier revision
Material now grows into a circular Volt-outlined inset with a leader back to the full belt. Elastic views use the main product image at larger scale with a lower-edge mask. Three vertical steps track the active message and reverse with scrolling. Reviewed at 375 × 812 and 1440 × 1000; no desktop horizontal overflow. All 35 interaction/animation tests and static site checks pass. No new image generation or signup settings changes.

### Remove P001 fit step
Removed the third P001 moment and its progress indicator. The story now ends on the material magnifier, with scroll travel reduced to 160vh desktop / 120svh mobile. Browser inspection confirms two moments, two indicators, no fit copy, and Mission outside the product section. All 35 tests and static checks pass.

### Static P001 hero
Removed all hero scroll choreography, pinned space, magnifier and step indicators. Restored the responsive static hero with full product image, original introduction and modal CTA. Removed obsolete hero animation code and styles. Rebuilt, reviewed locally, and passed 32 remaining tests plus static site checks.

### Survival Club catalog, retail tee imagery, and homepage invitation (October 21, 2026)

- Added the image-led invitation after Mark of the Survivors and before signup. Its link navigates to the collection without opening the modal. P001 remains a static hero.
- Replaced the carousel with black tee, white tee and cap stories, four reversible views each. Removed carousel timing/swipe code and modal dependencies. Desktop image placement alternates right, left, right, including mirrored progress indicators on the white tee. Tablet/mobile use stacked layouts.
- Generated six tee masters using the owner-supplied Premium Retail Tee screenshot for visible cut/material appearance and original Eleven Forward artwork for front/back designs. Generated one cap angle, preserved cap front/side crops, and prepared graphic/embroidery details. Checked lettering, colors, graphic arrangement, ribbon and garment shape visually. Images remain concept visualizations; supplier fiber composition, dimensions and pixel-identical print distress cannot be inferred from a screenshot.
- All twelve mobile WebP variants are under 39 KB (180 KB target). Masters/reference/prompts are outside dist. The new image preparation script records dimensions and unique responsive candidates.
- Thirty automated tests pass, covering view mapping, reverse/rapid progress, controlled decode delay, reduced-motion/short-screen fallback, each product's modal selection, multiple interests, close/focus restoration, no automatic modal on anchors, existing signup behavior and mark animation. Static checks pass for routes, anchors, consent, launch guard, images and absence of em dashes. Obsolete carousel tests were replaced.
- Browser reviewed 375 × 812, 768 × 1024 and 1440 × 1000, plus 720 × 500 short-screen layout (equivalent CSS viewport to 200% zoom at 1440 × 1000). Checked forward/reverse scrolling, direct product anchors, resizing and modal selections for all three products; no horizontal overflow observed. The homepage invitation's direct navigation and mobile stacked layout were reviewed.
- A script-free served fixture verified all 12 images in normal flow with no sticky stages. Reduced-motion logic and slow decoding were verified in controlled tests; OS reduced motion, actual browser zoom and real network throttling were not toggled. No real form submission was sent; signup remains disabled.
- Both handoff archives refreshed. Production deployment is not independently verified by this local review.
