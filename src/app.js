document.documentElement.classList.add('js');
const menu = document.querySelector('.menu');
const navLinks = document.querySelector('.nav-links');
function closeMenu() { if (!menu || !navLinks) return; menu.setAttribute('aria-expanded', 'false'); navLinks.dataset.open = 'false'; menu.textContent = 'Menu +'; }
menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); navLinks.dataset.open = String(open); menu.textContent = open ? 'Close −' : 'Menu +'; });
navLinks?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
window.matchMedia('(min-width: 641px)').addEventListener('change', closeMenu);
const carousel = document.querySelector('.carousel');
let currentProduct = 'shirt-black';
if (carousel) {
 const slides = [...carousel.querySelectorAll('.carousel-slide')];
 const counter = carousel.querySelector('.carousel-position');
 let index = 0;
 function showSlide(next) {
  index = (next + slides.length) % slides.length;
  slides.forEach((slide, i) => { slide.hidden = i !== index; });
  currentProduct = slides[index].dataset.product;
  counter.textContent = `${index + 1} / ${slides.length}`;
 }
 carousel.querySelector('.carousel-prev').addEventListener('click', () => showSlide(index - 1));
 carousel.querySelector('.carousel-next').addEventListener('click', () => showSlide(index + 1));
 carousel.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); showSlide(index + (event.key === 'ArrowRight' ? 1 : -1)); }
 });
 let start;
 carousel.addEventListener('touchstart', event => { start = {x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY}; }, {passive:true});
 carousel.addEventListener('touchend', event => {
  if (!start) return;
  const dx = event.changedTouches[0].clientX - start.x;
  const dy = event.changedTouches[0].clientY - start.y;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showSlide(index + (dx < 0 ? 1 : -1));
  start = null;
 }, {passive:true});
}
const dialog = document.querySelector('#interest-dialog');
if (dialog && typeof dialog.showModal === 'function') {
 let opener;
 const choices = [...dialog.querySelectorAll('[name="product_choices"]')];
 document.querySelectorAll('[data-interest]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); opener = link;
  const selected = link.dataset.interest === 'current' ? currentProduct : link.dataset.interest;
  choices.forEach(input => { input.checked = input.value === selected; input.setCustomValidity(''); });
  dialog.showModal(); document.documentElement.classList.add('modal-open');
  choices.find(input => input.checked)?.focus();
 }));
 dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
 dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
 });
 dialog.addEventListener('close', () => { document.documentElement.classList.remove('modal-open'); opener?.focus(); });
}
for (const form of document.querySelectorAll('form[data-enabled]')) {
 if (form.dataset.enabled !== 'true') continue;
 const status = form.querySelector('.form-status');
 const button = form.querySelector('[type="submit"]');
 const choices = [...form.querySelectorAll('[name="product_choices"]')];
 function validateInterests() {
  if (choices.length) choices[0].setCustomValidity(choices.some(input => input.checked) ? '' : 'Choose at least one product.');
 }
 choices.forEach(input => input.addEventListener('change', validateInterests));
 let pending = false;
 form.addEventListener('submit', async event => {
  event.preventDefault(); validateInterests();
  if (pending || !form.reportValidity()) return;
  if (choices.length) form.elements.product_interests.value = choices.filter(input => input.checked).map(input => input.parentElement.textContent.trim()).join(', ');
  pending = true; button.disabled = true; button.textContent = 'Submitting…'; form.setAttribute('aria-busy', 'true');
  status.dataset.state = 'pending'; status.textContent = 'Sending your signup…';
  form.elements.client_submitted_at.value = new Date().toISOString();
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
  try {
   const response = await fetch(form.action, {method:'POST',body:new FormData(form),signal:controller.signal,headers:{Accept:'application/json'}});
   const result = await response.json();
   if (!response.ok || result.success !== true) throw new Error('rejected');
   status.dataset.state = 'success'; status.textContent = 'You’re on the list. Thanks for moving forward with us.';
   form.querySelectorAll('fieldset').forEach(fieldset => { fieldset.disabled = true; });
   button.textContent = 'Signed up';
  } catch (error) {
   status.dataset.state = 'error';
   status.textContent = error.name === 'AbortError' ? 'We couldn’t confirm your signup in time. Your details are still here; please try again.' : 'Your signup couldn’t be confirmed. Please check your connection and try again.';
   button.disabled = false; button.textContent = 'Get updates';
  } finally { clearTimeout(timeout); pending = false; form.removeAttribute('aria-busy'); }
 });
}
