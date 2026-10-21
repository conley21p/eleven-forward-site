# Eleven Forward website

A static local review website for wearElevenForward.com. **Not published. Email signup is disabled. Policies are drafts.**

## Review

Open `http://127.0.0.1:4173/` while the preview server is running. To start it from this project directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Use a local web server rather than opening HTML files directly: asset and route URLs begin at the website root.

Survival Club lives at `/survival-club/`, linked from the shared navigation. It presents three scroll-driven product stories and explicit product-interest signup buttons. A homepage invitation links to this collection.

## Project contents

- `dist/`: ready-to-upload static output. Current output is a review build, not a public launch build.
- `src/`: CSS, browser interactions, and launch configuration.
- `scripts/build.py`: page content, metadata, policy text, and static output generation.
- `scripts/prepare_assets.py`: asset preparation; uses preserved originals on subsequent runs.
- `originals/`: preserved supplied images; never upload this directory.
- `tests/`: deterministic signup tests and static link/consent checks.
- `review/`: browser screenshots and verification report; never upload this directory.
- `ASSETS.md`: sources and preparation notes.
- `DEPLOYMENT.md`: Cloudflare launch, redirects, verification, rollback.

## Rebuild and check

Use Python 3.10+ with Pillow installed and Node.js 20+ for the tests. Install the Python dependency with `python3 -m pip install -r requirements.txt`.

```sh
python3 scripts/build.py
node --test tests/*.test.mjs
python3 tests/check_site.py
```

`tests/check_site.py` verifies the current disabled review build. Re-run/revise review-specific assertions deliberately when moving to production. Signup behavior tests use simulated Web3Forms responses; they do not send real emails.

To regenerate optimized images, run `python3 scripts/prepare_assets.py`, followed by `python3 scripts/prepare_catalog_assets.py`. It uses the preserved images and fonts in `originals/`. The generated logo is extracted from the supplied raster brand sheet, not a font substitution. Font source files and license are supplied in the output assets directory.

## Configure public signup

Do this only after owner review. Edit `src/config.json`:

1. Set `web3formsAccessKey` to the public form access key associated with the verified receiving inbox.
2. Set `businessName` and `publicContactEmail` to the correct business identity and working contact inbox.
3. Review and finalize the Terms, Privacy Policy, and consent wording in `scripts/build.py`. Keep the checkbox wording and submitted `consent_text` identical.
4. Add `src/approved-retention.html` with the owner-approved retention paragraph. Do not put account credentials in this file.
5. Replace all three draft version identifiers with the approved dated versions.
6. Set `policiesApproved` and `signupEnabled` to `true`, then rebuild and test.

The build refuses an enabled signup without a key, public contact email, business identity, approved policy flag, approved retention paragraph, and non-draft version identifiers. These are configuration checks; they cannot determine whether a policy or mailbox has actually been approved or verified.

The access key is intentionally delivered to the browser. It is a public form identifier, not an account secret. Never include Cloudflare API tokens, login credentials, or private keys in `src/`, `dist/`, or an uploaded archive.

## Signup behavior

Required email and initially unchecked marketing/terms consent; fixed source and policy versions; honeypot; client timestamp when JavaScript is available. Success requires an HTTP-success response containing boolean `success: true`. Errors retain the inputs. A 15-second timeout reports an unconfirmed signup and allows retry; it cannot prove that a provider did not receive a timed-out request.

Without JavaScript, enabled forms submit directly to Web3Forms and redirect to `/thank-you/`; the client timestamp is blank. Web3Forms handles native validation/errors beyond browser required-field checks. The current disabled fieldset also prevents native review submissions.

This is inbox delivery only. The owner must establish campaign sending, unsubscribe handling, suppression, and consent record retention before sending marketing campaigns.

## Survival Club catalog and interest dialog

The collection at `/survival-club/` has black tee, white tee and cap stories. Desktop imagery alternates right, left, right; tablet and mobile stack. Tees have three views (front, back, graphic detail); the cap has four. Each stage uses natural reversible scrolling; the final tee moment zooms the same back-image element, using the shared frame scheduler. Progress indicators have no timers or carousel controls. New tee imagery follows the owner-supplied retail blank reference for cut and visible jersey texture, with the original artwork. All product imagery is labeled as design concepts.

`Stay in the loop` opens the existing dialog with the clicked product selected. P001 stays first in the multiple-interest choices. The homepage invitation navigates directly to the collection; the static P001 hero opens its own product interest modal. No page or hash opens a modal automatically. Signup remains disabled until the existing launch requirements are complete.

Catalog image transitions wait for decoding and prefetch the next view. Reduced motion, JavaScript-free browsing and screens under 600px high use normal-flow galleries. Run asset preparation before rebuilding if masters change. `scripts/prepare_catalog_assets.py` produces transparent responsive WebP files with PNG fallbacks and a dimension manifest consumed by the builder. Generation prompts and the supplier reference are preserved in `originals/catalog/`; transparent source masters are in its `cutouts/` directory.

CSS and JavaScript references include content hashes so each release loads matching assets. HTML uses a revalidation cache policy; unchanged image/font assets can still be cached.

## Homepage scroll scenes

P001 is a normal static hero with the branded full-band image and product-update CTA. It has no pinned scroll area, magnifier, or step indicators. Mission and Lived Experience retain their shorter scroll reveals, and section 03 retains its four-stage logo story. These scenes share one event-driven animation-frame queue and respect reduced motion.
