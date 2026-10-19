document.documentElement.classList.add('js');
const menu = document.querySelector('.menu');
const navLinks = document.querySelector('.nav-links');
function closeMenu() { if (!menu || !navLinks) return; menu.setAttribute('aria-expanded', 'false'); navLinks.dataset.open = 'false'; menu.textContent = 'Menu +'; }
menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); navLinks.dataset.open = String(open); menu.textContent = open ? 'Close −' : 'Menu +'; });
navLinks?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
window.matchMedia('(min-width: 641px)').addEventListener('change', closeMenu);
const form = document.querySelector('#updates-form');
if (form && form.dataset.enabled === 'true') {
 const status = document.querySelector('#form-status');
 const button = form.querySelector('[type="submit"]');
 let pending = false;
 form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending || !form.reportValidity()) return;
  pending = true; button.disabled = true; button.textContent = 'Submitting…'; form.setAttribute('aria-busy', 'true');
  status.dataset.state = 'pending'; status.textContent = 'Sending your signup…';
  form.elements.client_submitted_at.value = new Date().toISOString();
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
  try {
   const response = await fetch(form.action, {method:'POST',body:new FormData(form),signal:controller.signal,headers:{Accept:'application/json'}});
   const result = await response.json();
   if (!response.ok || result.success !== true) throw new Error('rejected');
   status.dataset.state = 'success'; status.textContent = 'You’re on the list. Thanks for moving forward with us.';
   form.querySelector('fieldset').disabled = true;
   button.textContent = 'Signed up';
  } catch (error) {
   status.dataset.state = 'error';
   status.textContent = error.name === 'AbortError' ? 'We couldn’t confirm your signup in time. Your details are still here; please try again.' : 'Your signup couldn’t be confirmed. Please check your connection and try again.';
   button.disabled = false; button.textContent = 'Get updates';
  } finally { clearTimeout(timeout); pending = false; form.removeAttribute('aria-busy'); }
 });
}
