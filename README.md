# Eleven Forward website

A static local review website for wearElevenForward.com. **Not published. Email signup is disabled. Policies are drafts.**

## Review

Open `http://127.0.0.1:4173/` while the preview server is running. To start it from this project directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Use a local web server rather than opening HTML files directly: asset and route URLs begin at the website root.

Survival Club lives at `/survival-club/`, linked from the shared navigation. Its carousel and product-interest modal are separate from the homepage.

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

To regenerate optimized images, run `python3 scripts/prepare_assets.py`. It uses the preserved images and fonts in `originals/`. The generated logo is extracted from the supplied raster brand sheet, not a font substitution. Font source files and license are supplied in the output assets directory.

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

## Product carousel and interest dialog

Survival Club includes black tee, white tee, and cap concepts, with previous/next controls, arrow-key navigation, and horizontal swipe. It rotates every six seconds while visible, with Pause/Play and pauses on hover, focus, an open modal, or a hidden browser tab. Reduced-motion visitors start paused. Without JavaScript, all concepts remain visible and signup links lead to the footer form.

“Stay in the loop” opens a native dialog and defaults to the displayed product. The hero CTA defaults to P001. P001 is always listed first. Product checkboxes allow multiple choices, with at least one required for an enabled submission. Opening the dialog resets product choices to the selected CTA product; it retains any email already typed. Product interests are sent as a readable comma-separated summary alongside the selected product values. The footer form includes the same product choices and submits its own readable product-interest summary. Signup links on the home page open the modal only when clicked. Policy-page links navigate to the home-page signup section; visiting or refreshing a URL never opens the modal automatically.

In review mode, the carousel and product choices work, but email/consent/submission controls remain disabled. Production activation uses the same configuration and policy prerequisites as the footer form. No real signup has been sent during automated testing.

CSS and JavaScript references include content hashes so each release loads matching assets. HTML uses a revalidation cache policy; unchanged image/font assets can still be cached.

## Homepage scroll scenes

P001 uses a native sticky scene with full-band, mesh and elastic-band moments. Copy crossfades above the image; top and bottom elastic close-ups share the final moment. The persistent CTA opens the existing P001 interest modal. Mission and Lived Experience use shorter normal-scroll reveals. The neutral founder image has a separate CSS light behind the text, outside the face. Section 03 retains its existing four-stage logo story.

All scenes share one event-driven animation-frame queue, pause offscreen/when hidden, and recalculate on viewport/image changes. Product detail transitions wait for image decoding; pending details hold the last ready frame. Reduced-motion and screens below 600px high use the stacked product layout. Without application JavaScript all copy and four product views remain visible. Asset preparation reads the new source masters in `originals/`, generates responsive website files, and leaves historical sources untouched.
