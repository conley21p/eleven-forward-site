/* Native Shopify customer forms own consent and submission. This enhancement
 * prevents repeated clicks and restores controls after browser history returns. */
const submitted = new WeakSet();
document.addEventListener('submit', event => {
 const form = event.target;
 if (!(form instanceof HTMLFormElement) || !form.id.startsWith('Newsletter-')) return;
 if (submitted.has(form)) { event.preventDefault(); return; }
 submitted.add(form);
 form.setAttribute('aria-busy','true');
 const button = form.querySelector('button[type="submit"]');
 if (button) { button.disabled = true; button.textContent = 'Submitting…'; }
});
window.addEventListener('pageshow', () => {
 document.querySelectorAll('form[id^="Newsletter-"]').forEach(form => {
  submitted.delete(form); form.removeAttribute('aria-busy');
  const button = form.querySelector('button[type="submit"]');
  if (button) { button.disabled = false; button.textContent = 'Subscribe'; }
 });
});

// Re-render identity through Shopify; account-domain and storefront sessions
// can arrive at different times. Never infer authentication from a URL or click.
let accountRefresh;
async function refreshAccountEntry() {
 const current = document.querySelector('[data-account-entry]');
 if (!current || current.dataset.accountClient === 'oauth' || accountRefresh) return;
 const url = new URL(current.dataset.accountStateUrl, window.location.origin);
 if (url.origin !== window.location.origin) return;
 const controller = new AbortController();
 const timeout = window.setTimeout(() => controller.abort(), 6000);
 accountRefresh = (async () => {
  try {
   const response = await fetch(url, {credentials:'same-origin',cache:'no-store',signal:controller.signal});
   if (!response.ok) return;
   const sections = await response.json();
   const html = sections['customer-account-state'];
   if (typeof html !== 'string') return;
   const next = new DOMParser().parseFromString(html,'text/html').querySelector('[data-account-entry]');
   if (!next || !current.isConnected || next.dataset.accountAuthenticated === current.dataset.accountAuthenticated) return;
   current.replaceWith(document.importNode(next,true));
  } catch (_) { /* Keep the last server-rendered account control on failure. */ }
  finally { window.clearTimeout(timeout); }
 })();
 await accountRefresh;
 accountRefresh = null;
}
window.addEventListener('focus', refreshAccountEntry);
window.addEventListener('pageshow', event => { if (event.persisted) refreshAccountEntry(); });
document.addEventListener('click', event => {
 document.querySelectorAll('.account-menu[open]').forEach(menu => {
  if (!menu.contains(event.target)) menu.open = false;
 });
});
document.addEventListener('keydown', event => {
 if (event.key !== 'Escape') return;
 const menu = document.querySelector('.account-menu[open]');
 if (menu) { menu.open = false; menu.querySelector('summary').focus(); }
});
const catalogRedirect = document.querySelector('[data-catalog-redirect]');
if (catalogRedirect) {
 const destination = new URL(catalogRedirect.dataset.catalogRedirect, window.location.origin);
 if (destination.origin === window.location.origin && destination.pathname !== window.location.pathname) {
  destination.search = window.location.search;
  destination.hash = window.location.hash;
  window.location.replace(destination.href);
 }
}
