# Cloudflare Pages launch handoff

Status: local review only. No Cloudflare changes, domain changes, Web3Forms requests, or real email submissions have been made.

## Before upload

- Verify the receiving inbox and Web3Forms form key with the owner.
- Finalize business identity, public contact inbox, policies, retention schedule, and withdrawal process.
- Review logo, founder crop, concept labels, mobile layout, and final copy.
- Enable signup through the documented configuration and rebuild. Check that no draft text or placeholders remain.
- Re-run signup tests and production link/accessibility checks. Perform one real controlled signup with an owner-provided test address and verify inbox delivery and consent fields.
- Confirm Web3Forms spam filtering options available for the owner's plan; the supplied honeypot is already included. If adding a CAPTCHA, update the form and CSP using provider documentation, then retest.

## First deployment

1. Sign into the owner's Cloudflare account. In Workers & Pages, create a **Pages** project using **Direct Upload**, named `eleven-forward` if available. Direct Upload is the chosen release workflow; source lives in this local project and its backups.
2. Upload only the contents of `dist/`, including `_headers` and `404.html`. Never upload the whole project, originals, tests, or review files.
3. Add `wearelevenforward.com` via Pages → Custom domains → Set up a custom domain. Use Cloudflare's proposed DNS record after checking for conflicts. Preserve mail MX/TXT records.
4. Wait for the custom domain and HTTPS certificate to become active. Use HTTPS redirects/Always Use HTTPS as appropriate for both zones.
5. Configure the following Single Redirect rules, using proxied DNS records for redirect hostnames. Redirect status: **301**. Dynamic destination: `concat("https://wearelevenforward.com", http.request.uri.path)`. Enable **Preserve query string**.

| Zone | Hostnames matched |
| --- | --- |
| `wear11forward.com` | `wear11forward.com` and `www.wear11forward.com` |
| `wearelevenforward.com` | `www.wearelevenforward.com` |

Rule expressions may use `http.host in {"wear11forward.com" "www.wear11forward.com"}` and `http.host eq "www.wearelevenforward.com"` respectively. Review existing records and rules before adding anything; do not replace unrelated DNS records.

6. Redirect the actual production `<project>.pages.dev` address to the canonical domain using Cloudflare Bulk Redirects, with subpath matching, path suffix preservation, and query preservation. Do not redirect or expose branch preview hosts unintentionally.
7. Keep preview deployments protected through Cloudflare Access or a noindex build. Do not index draft builds. Current output emits noindex metadata and an X-Robots-Tag and disallows crawling; approved production output removes the global review restrictions.

Do not use the Pages `_redirects` file for domain-level redirection.

## Release verification

- HTTPS works at the canonical domain.
- Both alternate-domain variants and canonical `www` redirect in one hop where possible, preserving `/privacy/?test=1`.
- The production `pages.dev` host redirects without a loop.
- `/terms/`, `/privacy/`, `/thank-you/`, and a nonexistent URL display the intended pages.
- Security headers are present. CSP permits Web3Forms submission and blocks external script/frame content.
- Email and consent are required and consent starts unchecked. Check success, error, repeated-click, and JavaScript-disabled behavior.
- Verify a real submission in the receiving inbox. Record consent/policy versions. Confirm withdrawal requests can reach the contact inbox.
- Inspect current Safari, Chrome, Firefox, mobile Safari and Chrome, 200% zoom, keyboard navigation, and reduced motion. Run mobile Lighthouse; target performance ≥90 with no critical accessibility findings.

## Replacement and rollback

Keep a dated backup of each approved source and `dist/` bundle. Upload replacement output as a new production deployment in the same Pages project; preserve the custom domain and redirect rules. Record the returned deployment identifier and URL in the release notes.

Before replacement, retain the prior successful deployment. If verification fails, use Pages' production deployment rollback action to restore the previous successful deployment, then recheck the canonical site and signup. The first deployment has no earlier production version; take the release offline if required while repairing it. DNS changes are separate from deployment rollback and must be reviewed separately.

## Official references

- [Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Redirect the production pages.dev address](https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/)
- [Pages redirects and domain-level limitation](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Web3Forms installation](https://docs.web3forms.com/getting-started/installation)
