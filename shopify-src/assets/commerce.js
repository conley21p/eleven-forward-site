// Native Shopify forms remain the fallback. This component adds selection,
// decoded color changes, and inline errors without duplicating cart requests.
class ProductPicker extends HTMLElement {
 connectedCallback() {
  if (this.controller) return;
  this.controller = new AbortController();
  this.data = JSON.parse(this.querySelector('[data-picker-products]').textContent);
  this.color = this.dataset.color;
  this.products = this.querySelector('[data-color-choice]') ? this.data : { [this.color]: this.data.current };
  this.current = this.products[this.color] || this.data.current;
  this.select = this.querySelector('[data-variant]');
  this.form = this.querySelector('form');
  this.status = this.querySelector('[data-purchase-status]');
  this.add = this.querySelector('[data-add]');
  this.pending = false;
  const on = (node, event, callback) => node?.addEventListener(event, callback, {signal:this.controller.signal});
  on(this.select, 'change', () => { this.status.textContent = ''; this.update(); this.updateUrl(); });
  this.querySelectorAll('[data-color-choice]').forEach(button => on(button, 'click', () => this.changeColor(button.dataset.colorChoice)));
  this.querySelectorAll('[data-fit]').forEach(button => on(button, 'click', () => {
   this.querySelectorAll('[data-fit]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
   this.querySelectorAll('[data-guidance]').forEach(panel => { panel.hidden = panel.dataset.guidance !== button.dataset.fit; });
   const guide = this.querySelector('.size-guide'); if (guide) guide.open = true;
   // Sizing guidance never changes product, selected size, quantity or price.
  }));
  on(this.form, 'submit', event => this.submit(event));
  this.querySelectorAll('[data-band-gender]').forEach(button => on(button, 'click', () => this.setBandGender(button.dataset.bandGender)));
  if (this.current?.band_sizing) this.setBandGender(this.bandGenderFor(this.variant) || 'men', true);
  on(this.querySelector('[data-band-guide]'), 'click', () => {
   const dialog = this.querySelector('[data-band-guide-dialog]');
   if (typeof dialog?.showModal !== 'function') return;
   this.renderBandGuide(); dialog.showModal(); document.documentElement.classList.add('band-guide-open');
  });
  on(this.querySelector('[data-band-guide-close]'), 'click', () => this.querySelector('[data-band-guide-dialog]').close());
  on(this.querySelector('[data-band-guide-dialog]'), 'close', () => {
   document.documentElement.classList.remove('band-guide-open');
   this.querySelector('[data-band-guide]')?.focus({preventScroll:true});
  });
  this.update();
 }
 disconnectedCallback() { if (this.querySelector('[data-band-guide-dialog]')?.open) { this.querySelector('[data-band-guide-dialog]').close(); document.documentElement.classList.remove('band-guide-open'); } this.controller?.abort(); this.controller = null; this.colorRequest = (this.colorRequest || 0) + 1; }
 get variant() { return this.current?.product?.variants?.find(v => String(v.id) === this.select.value); }
 update() {
  const variant = this.variant;
  const ready = this.current?.ready === true;
  this.add.disabled = this.pending || this.changingColor || !ready || !variant?.available;
  this.select.disabled = this.pending || this.changingColor || this.current?.configured === false || !this.current?.product;
  this.querySelectorAll('[data-color-choice], [data-fit]').forEach(button => { button.disabled = this.pending || this.changingColor; });
  this.querySelectorAll('[data-band-gender]').forEach(button => { button.disabled = this.pending; });
  this.closest('ef-quick-shop')?.querySelectorAll('[data-quick-gender]').forEach(button => { button.disabled = this.pending; });
  this.querySelectorAll('ef-quantity').forEach(control => control.toggleAttribute('disabled', this.pending));
  if (this.form) this.form.setAttribute('aria-busy', String(this.pending));
  this.add.setAttribute('aria-busy', String(this.pending));
  this.add.textContent = this.pending ? 'Adding…' : !ready ? 'Coming soon' : variant && !variant.available ? 'Sold out' : 'Add to cart';
  const price = this.querySelector('[data-price]');
  const cheapest = [...(this.current?.product?.variants || [])].sort((a,b) => a.price - b.price)[0];
  const prices = this.classList.contains('band-config') ? this.current?.prices_short || this.current?.prices : this.current?.prices;
  price.textContent = !ready ? 'Price to be announced' : variant ? prices[String(variant.id)] : `${this.current.product.price_varies ? 'From ' : ''}${prices[String(cheapest?.id)] || ''}`;
  const accelerated = this.querySelector('[data-accelerated]');
  if (accelerated) accelerated.hidden = !ready || !variant?.available || this.pending || this.changingColor;
  if (this.current?.band_sizing) this.renderBandGuide();
  const link = this.querySelector('[data-product-link]') || this.closest('[data-commerce-story]')?.querySelector('[data-product-link]');
  if (link) link.href = this.current?.url || `${this.dataset.root}products/survival-club-tee-${this.color}`;
 }
 renderBandGuide() {
  const body = this.querySelector('[data-band-guide-rows]');
  if (!body) return;
  const gender = this.bandGender || 'men';
  const groups = gender === 'men' ? ['S/M', 'L/XL'] : ['XS/S', 'M/L', 'XL/XXL'];
  const options = this.variant?.options || [this.variant?.option1, this.variant?.option2, this.variant?.option3];
  const selected = groups.find(size => options.includes(size));
  body.replaceChildren();
  groups.forEach(size => {
   const row = document.createElement('tr');
   if (size === selected) row.dataset.selected = 'true';
   const label = document.createElement('td'), waist = document.createElement('td');
   label.textContent = size;
   const range = this.current.waist_ranges?.[gender]?.[size];
   waist.textContent = range ? `${range} in` : 'To be confirmed';
   row.append(label, waist); body.append(row);
  });
  this.querySelector('[data-band-guide-product]').textContent = `${this.current.product.title} · ${gender === 'men' ? 'Men’s' : 'Women’s'}`;
 }
 bandGenderFor(variant) {
  const options = variant?.options || [variant?.option1, variant?.option2, variant?.option3];
  const normalize = value => String(value || '').toLowerCase().replace(/[’']/g, '').trim();
  if (options.some(value => ['women', 'womens', 'female'].includes(normalize(value)))) return 'women';
  if (options.some(value => ['men', 'mens', 'male'].includes(normalize(value)))) return 'men';
  return null;
 }
 setBandGender(gender, initial = false) {
  if (!this.current?.band_sizing || this.pending || !['men', 'women'].includes(gender)) return;
  const previous = this.variant;
  const groups = gender === 'men' ? ['S/M', 'L/XL'] : ['XS/S', 'M/L', 'XL/XXL'];
  const entries = groups.map(size => {
   const variant = this.current.product.variants.find(candidate => {
    const values = candidate.options || [candidate.option1, candidate.option2, candidate.option3];
    return values.some(value => String(value || '').toUpperCase().replace(/\s/g, '') === size)
     && (!this.bandGenderFor(candidate) || this.bandGenderFor(candidate) === gender);
   });
   const range = this.current.waist_ranges?.[gender]?.[size]?.trim();
   const title = `${size}${range && !this.classList.contains('band-config') ? ` — ${range} in` : ''}${!variant ? ' — Coming soon' : !variant.available ? ' — Sold out' : ''}`;
   return {size, variant, title};
  });
  this.bandGender = gender;
  this.select.replaceChildren(new Option('Choose size', ''));
  entries.forEach(entry => {
   const option = new Option(entry.title, entry.variant ? String(entry.variant.id) : '');
   option.disabled = !entry.variant?.available; this.select.add(option);
  });
  let selection = entries.find(entry => entry.variant && entry.variant.id === previous?.id);
  if (!selection && initial) selection = entries.find(entry => entry.size === (gender === 'men' ? 'L/XL' : 'M/L') && entry.variant?.available);
  this.select.value = selection?.variant ? String(selection.variant.id) : '';
  const controls = [...this.querySelectorAll('[data-band-gender]'), ...this.closest('ef-quick-shop')?.querySelectorAll('[data-quick-gender]') || []];
  controls.forEach(button => button.setAttribute('aria-pressed', String((button.dataset.bandGender || button.dataset.quickGender) === gender)));
  this.status.textContent = '';
  this.update();
  if (!initial) this.updateUrl();
 }
 updateUrl() {
  if (this.dataset.mode !== 'detail') return;
  const url = new URL(location.href);
  if (this.variant) url.searchParams.set('variant', this.variant.id); else url.searchParams.delete('variant');
  history.replaceState(null, '', url);
  this.dispatchEvent(new CustomEvent('variant:change', {bubbles:true,detail:{variant:this.variant || null}}));
 }
 async changeColor(color) {
  if (color === this.color || this.pending || this.changingColor) return;
  const next = this.products[color];
  const size = this.variant?.option1;
  const match = next?.product?.variants?.find(v => v.option1 === size);
  if (this.dataset.mode === 'detail') {
   if (!next?.url) { this.status.textContent = 'This color is not available yet.'; return; }
   const destination = new URL(next.url, location.origin);
   if (match) destination.searchParams.set('variant', match.id);
   location.assign(destination.href); return;
  }
  const story = this.closest('[data-commerce-story]');
  const template = story?.querySelector(`[data-color-media="${color}"]`);
  if (!template) return;
  const request = this.colorRequest = (this.colorRequest || 0) + 1;
  this.changingColor = true; this.setAttribute('aria-busy','true');
  this.querySelectorAll('[data-color-choice]').forEach(button => { button.disabled = true; });
  this.status.textContent = 'Loading color…';
  this.update();
  try {
   const pictures = [...template.content.querySelectorAll('picture')];
   await Promise.all(pictures.map(picture => {
    const source = picture.querySelector('source');
    const image = picture.querySelector('img');
    const preload = new Image();
    preload.sizes = source?.sizes || '100vw';
    if (source?.srcset) preload.srcset = source.srcset;
    preload.src = image.src;
    return preload.decode();
   }));
   if (!this.isConnected || request !== this.colorRequest) return;
   const visible = [...story.querySelector('.catalog-gallery').querySelectorAll('picture')];
   // Commit all views together after decoding; preserve transforms and scroll.
   pictures.forEach((picture,i) => {
    const source = picture.querySelector('source'), image = picture.querySelector('img');
    const oldSource = visible[i].querySelector('source'), oldImage = visible[i].querySelector('img');
    oldSource.srcset = source.srcset; oldSource.sizes = source.sizes;
    oldImage.src = image.src; oldImage.alt = image.alt;
    oldImage.width = image.width; oldImage.height = image.height;
   });
   this.color = color; this.current = next; this.dataset.color = color; story.dataset.color = color;
   this.querySelectorAll('[data-color-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.colorChoice === color)));
   this.select.replaceChildren(new Option(next?.product ? 'Choose size' : 'Sizes coming soon', ''));
   for (const variant of (next?.configured === false ? [] : next?.product?.variants || [])) {
    const option = new Option(`${variant.title}${variant.available ? '' : ' — Sold out'}`, String(variant.id));
    option.disabled = !variant.available; this.select.add(option);
   }
   this.select.disabled = !next?.product || next?.configured === false;
   if (match) this.select.value = String(match.id);
   this.status.textContent = `${color === 'white' ? 'White' : 'Black'} selected.`;
   story.dispatchEvent(new CustomEvent('ef:colorchange'));
   this.update();
  } catch {
   if (this.isConnected) this.status.textContent = 'That color could not load. Your previous selection is unchanged. Select the color again to retry.';
  } finally {
   if (this.isConnected && request === this.colorRequest) {
    this.changingColor = false; this.removeAttribute('aria-busy');
    this.update();
   }
  }
 }
 async submit(event) {
  event.preventDefault();
  if (this.pending || this.changingColor || !this.current?.ready || !this.variant?.available || !this.form.reportValidity()) return;
  const body = new FormData(this.form); body.delete('return_to');
  this.pending = true; this.status.textContent = ''; this.update();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
   const response = await fetch(`${this.dataset.root}cart/add.js`, {method:'POST',body,headers:{Accept:'application/json'},signal:controller.signal});
   const result = await response.json();
   if (!response.ok) { this.status.textContent = result.description || 'This item could not be added. Check its availability and try again.'; return; }
   location.assign(this.dataset.cartUrl);
  } catch {
   this.status.textContent = 'We could not confirm the addition. Check your cart before trying again.';
  } finally { clearTimeout(timeout); this.pending = false; this.update(); }
 }
}
if (!customElements.get('ef-product-picker')) customElements.define('ef-product-picker', ProductPicker);

const galleries = new WeakMap();
function initGalleries(root) {
 root.querySelectorAll('[data-product-detail]').forEach(gallery => {
  if (galleries.has(gallery)) return;
  const controller = new AbortController(); galleries.set(gallery, controller);
  gallery.querySelectorAll('[data-image-url]').forEach(button => button.addEventListener('click', async () => {
   const target = gallery.querySelector('[data-main-image] img');
   if (!target) return;
   const image = new Image(); image.src = button.dataset.imageUrl;
   try { await image.decode(); if (controller.signal.aborted) return; target.removeAttribute('srcset'); target.src = image.src; target.alt = button.dataset.imageAlt; gallery.querySelectorAll('[data-image-url]').forEach(b => b.setAttribute('aria-pressed',String(b===button))); } catch { /* Retain the currently visible image. */ }
  }, {signal:controller.signal}));
 });
}
initGalleries(document);
document.addEventListener('shopify:section:load', e => initGalleries(e.target));
document.addEventListener('shopify:section:unload', e => e.target.querySelectorAll('[data-product-detail]').forEach(gallery => {galleries.get(gallery)?.abort();galleries.delete(gallery);}));

// Each instance owns its listeners, including when Shopify reloads a section.
class QuantityControl extends HTMLElement {
 static get observedAttributes() { return ['disabled']; }
 connectedCallback() {
  if (this.controller) return;
  this.controller = new AbortController();
  this.input = this.querySelector('input');
  this.buttons = [...this.querySelectorAll('[data-quantity-step]')];
  const on = (node, event, callback) => node.addEventListener(event, callback, {signal:this.controller.signal});
  this.buttons.forEach(button => on(button, 'click', () => {
   if (this.input.disabled || this.hasAttribute('disabled') || button.disabled) return;
   this.normalize();
   if (Number(button.dataset.quantityStep) > 0) this.input.stepUp(); else this.input.stepDown();
   this.input.dispatchEvent(new Event('input', {bubbles:true}));
   this.input.dispatchEvent(new Event('change', {bubbles:true}));
  }));
  on(this.input, 'input', () => this.sync());
  on(this.input, 'change', () => { this.normalize(); this.sync(); });
  this.sync();
 }
 normalize() {
  const minimum = Number(this.input.min || 0);
  const maximum = this.input.max === '' ? Infinity : Number(this.input.max);
  const value = Number.isFinite(this.input.valueAsNumber) ? Math.floor(this.input.valueAsNumber) : minimum;
  this.input.value = String(Math.max(minimum, Math.min(maximum, value)));
 }
 sync() {
  if (!this.input) return;
  this.input.readOnly = this.hasAttribute('disabled');
  const value = Number(this.input.value);
  this.buttons.forEach(button => {
   button.disabled = this.input.disabled || this.hasAttribute('disabled') || (Number(button.dataset.quantityStep) < 0
    ? value <= Number(this.input.min || 0)
    : this.input.max !== '' && value >= Number(this.input.max));
  });
 }
 attributeChangedCallback() { this.sync(); }
 disconnectedCallback() { this.controller?.abort(); this.controller = null; }
}
if (!customElements.get('ef-quantity')) customElements.define('ef-quantity', QuantityControl);

class QuickShop extends HTMLElement {
 connectedCallback() {
  if (this.controller) return;
  this.dialog = this.querySelector('dialog');
  if (!this.dialog) return;
  this.controller = new AbortController();
  const on = (node, event, callback) => node?.addEventListener(event, callback, {signal:this.controller.signal});
  this.opener = this.querySelector('[data-quick-open]');
  on(this.opener, 'click', event => {
   if (typeof this.dialog.showModal !== 'function') return;
   event.preventDefault();
   this.dialog.showModal();
   document.documentElement.classList.add('quick-shop-open');
   this.querySelector('[data-quick-gender]')?.focus({preventScroll:true});
  });
  on(this.querySelector('[data-quick-close]'), 'click', () => { if (!this.pending) this.dialog.close(); });
  on(this.dialog, 'cancel', event => { if (this.pending) event.preventDefault(); });
  on(this.dialog, 'close', () => {
   document.documentElement.classList.remove('quick-shop-open');
   this.opener.focus({preventScroll:true});
  });
  this.querySelectorAll('[data-quick-gender]').forEach(button => on(button, 'click', () => {
   if (this.pending) return;
   this.gender = button.dataset.quickGender;
   this.querySelectorAll('[data-quick-gender]').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
   this.querySelector('ef-product-picker')?.setBandGender?.(this.gender);
  }));
  this.gender = 'men';
 }
 get pending() { return this.querySelector('ef-product-picker')?.pending; }
 disconnectedCallback() {
  if (this.dialog?.open) { this.dialog.close(); document.documentElement.classList.remove('quick-shop-open'); }
  this.controller?.abort(); this.controller = null;
 }
}
if (!customElements.get('ef-quick-shop')) customElements.define('ef-quick-shop', QuickShop);

// Quantity changes use the native cart update form; its response owns totals
// and stock errors. Retain a no-JavaScript update action in the markup.
document.addEventListener('change', event => {
 if (!event.target.matches?.('[data-cart-form] input[name="updates[]"]')) return;
 const form = event.target.closest('[data-cart-form]');
 if (form.dataset.submitting === 'true') return;
 form.requestSubmit(form.querySelector('[data-cart-update]'));
});
document.addEventListener('submit', event => {
 const form = event.target;
 if (!form.matches?.('[data-cart-form]')) return;
 if (form.dataset.submitting === 'true') { event.preventDefault(); return; }
 form.dataset.submitting = 'true';
 form.setAttribute('aria-busy','true');
 form.querySelectorAll('ef-quantity').forEach(control => control.setAttribute('disabled',''));
 form.querySelector('.cart-save-status').textContent = 'Updating your cart…';
});
window.addEventListener('pageshow', () => {
 document.querySelectorAll('[data-cart-form]').forEach(form => {
  delete form.dataset.submitting; form.removeAttribute('aria-busy');
  form.querySelectorAll('ef-quantity').forEach(control => control.removeAttribute('disabled'));
  form.querySelector('.cart-save-status').textContent = '';
 });
});
