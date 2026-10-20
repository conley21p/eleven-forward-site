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
