document.documentElement.classList.add('js');
const menu = document.querySelector('.menu');
const navLinks = document.querySelector('.nav-links');
function closeMenu() { if (!menu || !navLinks) return; menu.setAttribute('aria-expanded', 'false'); navLinks.dataset.open = 'false'; menu.setAttribute('aria-label', 'Open menu'); }
menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); navLinks.dataset.open = String(open); menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); });
navLinks?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
window.matchMedia('(min-width: 641px)').addEventListener('change', closeMenu);
const dialog = document.querySelector('#interest-dialog');
if (dialog && typeof dialog.showModal === 'function') {
 let opener;
 const choices = [...dialog.querySelectorAll('[name="product_choices"]')];
 document.querySelectorAll('[data-interest]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); opener = link;
  const selected = link.dataset.interest;
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

// All scroll stories share one event-driven animation-frame queue.
let sharedScrollScenes;
function registerScrollScene(element, update) {
 if (!sharedScrollScenes) {
  const scenes = new Set();
  let pending = null;
  const active = () => [...scenes].some(scene => scene.enabled && scene.visible);
  const schedule = () => {
   if (document.hidden || !active() || pending !== null) return;
   pending = window.requestAnimationFrame(() => {
    pending = null;
    if (!document.hidden) scenes.forEach(scene => { if (scene.enabled && scene.visible) scene.update(); });
   });
  };
  const cancelIdle = () => { if (!active() && pending !== null) { window.cancelAnimationFrame(pending); pending = null; } };
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('load', schedule, true);
  sharedScrollScenes = {scenes, schedule, cancelIdle};
 }
 const entry = {update, visible:true, enabled:false};
 const {scenes, schedule, cancelIdle} = sharedScrollScenes;
 scenes.add(entry);
 if ('IntersectionObserver' in window) new window.IntersectionObserver(entries => {
  entry.visible = entries[0].isIntersecting; cancelIdle(); schedule();
 }).observe(element);
 if ('ResizeObserver' in window) new window.ResizeObserver(schedule).observe(element);
 return {schedule, enable(value) { entry.enabled = value; cancelIdle(); schedule(); }};
}

// Pure scroll-to-frame mapping keeps scrubbing deterministic in either direction.
function markStoryFrame(progress) {
 const clamp = value => Math.max(0, Math.min(1, value));
 const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
 const reveal = ease((progress - 0.05) / 0.55);
 const guides = progress < 1 ? 0 : 1 - ease((progress - 3) / 0.25);
 const step = (start) => { const t = clamp((progress - start) / 0.4); return t === 0 || t === 1 ? 0 : -14 * Math.sin(Math.PI * t); };
 return {
  reveal, guides,
  date: ease(progress / 0.2) * (1 - ease((progress - 0.8) / 0.2)),
  diagonal: ease((progress - 1) / 0.4),
  reference: ease((progress - 1.4) / 0.35),
  arc: ease((progress - 1.75) / 0.25),
  angle: ease((progress - 1.75) / 0.25),
  arrow: ease((progress - 2) / 0.45),
  direction: ease((progress - 2) / 0.1) * (1 - ease((progress - 3) / 0.25)),
  arrowhead: ease((progress - 2.35) / 0.1),
  smallY: progress >= 3 ? step(3.05) : 0,
  tallY: progress >= 3.5 ? step(3.5) : 0,
  active: Math.min(3, Math.max(0, Math.floor(progress)))
 };
}
// Let the logo arrive before introducing the first paragraph.
function markIntroFrame(sectionTop, viewportHeight, headerBottom) {
 const ease = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
 return {
  reveal: ease((viewportHeight * 0.6 - sectionTop) / Math.max(1, viewportHeight * 0.6 - headerBottom)),
  copy: ease((headerBottom - sectionTop) / (viewportHeight * 0.12))
 };
}
const markStory = document.querySelector('[data-mark-story]');
if (markStory) {
 const panels = [...markStory.querySelectorAll('.meaning li')];
 const stage = markStory.querySelector('.mark-stage');
 const section = markStory.closest('.brand');
 const header = document.querySelector('.header');
 const reveal = markStory.querySelector('[data-mark-reveal]');
 const small = markStory.querySelector('[data-mark-small]');
 const tall = markStory.querySelector('[data-mark-tall]');
 const guides = markStory.querySelector('[data-mark-guides]');
 const date = markStory.querySelector('[data-mark-date]');
 const angle = markStory.querySelector('[data-mark-angle]');
 const drawPaths = Object.fromEntries(['diagonal', 'reference', 'arc'].map(group => [group, [...markStory.querySelectorAll(`[data-mark-draw="${group}"]`)]]));
 const direction = markStory.querySelector('[data-mark-direction]');
 const arrow = markStory.querySelector('[data-mark-arrow]');
 const arrowhead = markStory.querySelector('[data-mark-arrowhead]');
 const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 function paint(state) {
  reveal.setAttribute('y', String(95 - 115 * state.reveal));
  reveal.setAttribute('height', String(20 + 115 * state.reveal));
  small.setAttribute('transform', `translate(0 ${state.smallY})`);
  tall.setAttribute('transform', `translate(0 ${state.tallY})`);
  guides.style.opacity = String(state.guides);
  date.style.opacity = String(state.date);
  angle.style.opacity = String(state.angle);
  for (const [group, paths] of Object.entries(drawPaths)) paths.forEach(path => { path.style.strokeDashoffset = String(1 - state[group]); });
  direction.style.opacity = String(state.direction);
  arrow.style.strokeDashoffset = String(1 - state.arrow);
  arrowhead.style.opacity = String(state.arrowhead);
  panels[0].style.setProperty('--mark-copy-entry', String(state.copy ?? 1));
  panels.forEach((panel, i) => { panel.dataset.active = String(i === state.active); });
 }
 function update() {
  if (motion.matches) return;
  const first = panels[0].getBoundingClientRect();
  const mobile = window.matchMedia('(max-width: 640px)').matches;
  const stageBottom = stage.getBoundingClientRect().bottom;
  const focus = mobile ? Math.max(stageBottom + 70, window.innerHeight * 0.7) : window.innerHeight * 0.55;
  const progress = Math.max(0, Math.min(4, (focus - first.top) / first.height));
  const intro = markIntroFrame(section.getBoundingClientRect().top, window.innerHeight, header?.getBoundingClientRect().bottom ?? 0);
  paint({...markStoryFrame(progress), ...intro});
 }
 const scene = registerScrollScene(markStory, update);
 function configure() {
  markStory.classList.toggle('mark-story-ready', !motion.matches);
  scene.enable(!motion.matches);
  if (motion.matches) paint({...markStoryFrame(4),active:-1});
 }
 motion.addEventListener('change', configure);
 configure();
}


const sceneClamp = value => Math.max(0, Math.min(1, value));
const sceneEase = value => { const t = sceneClamp(value); return t * t * (3 - 2 * t); };
function missionSceneFrame(top, height) {
 const progress = (height - top) / (height * 0.5);
 return {lines:[0,0.15,0.3].map(start => sceneEase((progress - start) / 0.7)), finish:sceneEase((progress - 0.45) / 0.55)};
}
function founderSceneFrame(top, bottom, titleTop, height) {
 const enter = sceneEase((height - top) / (height * 0.5));
 return {enter, copy:sceneEase((height - titleTop) / (height * 0.45)), glow:sceneEase((height * 0.85 - titleTop) / (height * 0.35)) * sceneEase(bottom / (height * 0.5))};
}
const missionScene = document.querySelector('[data-mission-scene]');
if (missionScene) {
 const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 const lines = [...missionScene.querySelectorAll('.mission-line')];
 function update() {
  const enabled = !motion.matches && window.innerHeight >= 600;
  missionScene.classList.toggle('mission-scene-ready', enabled);
  if (!enabled) return;
  const state = missionSceneFrame(missionScene.querySelector('h2').getBoundingClientRect().top, window.innerHeight);
  lines.forEach((line,i) => { line.style.setProperty('--line-opacity', String(state.lines[i])); line.style.setProperty('--line-y', `${16 * (1 - state.lines[i])}px`); });
  missionScene.style.setProperty('--mission-rule', String(state.finish));
  missionScene.style.setProperty('--mission-color', [165,168,161].map((start,i) => Math.round(start + ([245,245,240][i] - start) * state.finish)).join(' '));
 }
 const scene = registerScrollScene(missionScene, update);
 motion.addEventListener('change', update); scene.enable(true);
}
const founderScene = document.querySelector('[data-founder-scene]');
if (founderScene) {
 const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 function update() {
  const enabled = !motion.matches && window.innerHeight >= 600;
  founderScene.classList.toggle('founder-scene-ready', enabled);
  if (!enabled) return;
  const rect = founderScene.getBoundingClientRect();
  const state = founderSceneFrame(rect.top, rect.bottom, founderScene.querySelector('h2').getBoundingClientRect().top, window.innerHeight);
  founderScene.style.setProperty('--founder-enter', String(state.enter));
  founderScene.style.setProperty('--founder-scale', String(1.03 - state.enter * .03));
  founderScene.style.setProperty('--founder-copy', String(state.copy));
  founderScene.style.setProperty('--founder-glow', String(state.glow));
 }
 const scene = registerScrollScene(founderScene, update);
 motion.addEventListener('change', update); scene.enable(true);
}

// Catalog views scrub with natural scroll. Static galleries are the default.
function catalogStoryFrame(progress, zoomBack = false) {
 const count = zoomBack ? 3 : 4;
 const p = Math.max(0, Math.min(count, progress));
 const view = Math.min(count - 1, Math.floor(p));
 const transition = view === 0 ? 1 : sceneEase((p - view) / .2);
 const weights = Array(count).fill(0);
 weights[view] = transition;
 if (view > 0) weights[view - 1] = 1 - transition;
 const active = transition >= .5 ? view : view - 1;
 const zoom = zoomBack ? sceneEase((p - 2) / .8) : 0;
 // The last tee moment continues using the back image itself, not a replacement crop.
 if (zoomBack && p >= 2) { weights.fill(0); weights[1] = 1; }
 const positions = weights.map((_,i) => i === view ? (view === 0 ? 0 : (transition - 1) * 100) : i === view - 1 ? transition * 100 : i < view ? 100 : -100);
 return {weights, positions, active, visualActive:zoomBack && p >= 2 ? 1 : active, zoom, slide:sceneEase((p - 1) / .2)};
}
for (const story of document.querySelectorAll('[data-catalog-story]')) {
 const stage = story.querySelector('.catalog-sticky');
 const zoomBack = story.id === 'shirt-black' || story.id === 'shirt-white';
 const views = [...story.querySelectorAll('[data-catalog-view]')];
 const steps = [...story.querySelectorAll('[data-catalog-step]')];
 const images = views.map(view => view.querySelector('img'));
 const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 const header = document.querySelector('.header');
 let settled = 0;
 const decoded = new WeakSet();
 const decoding = new WeakSet();
 function prepare(index) {
  const image = images[index];
  if (!image || decoded.has(image) || decoding.has(image)) return;
  image.loading = 'eager'; decoding.add(image);
  const decode = image.decode ? image.decode() : image.complete && image.naturalWidth ? Promise.resolve() : new Promise((resolve,reject) => { image.addEventListener('load',resolve,{once:true}); image.addEventListener('error',reject,{once:true}); });
  decode.then(() => { decoded.add(image); scene.schedule(); }).catch(() => { decoding.delete(image); });
 }
 function configure() {
  const enhanced = !motion.matches && window.innerHeight >= 600;
  story.classList.toggle('catalog-ready', enhanced);
  story.style.setProperty('--catalog-header', `${header?.getBoundingClientRect().height ?? 82}px`);
  if (!enhanced) {
   views.forEach(view => { view.style.opacity = ''; view.style.transform = ''; view.removeAttribute('aria-hidden'); });
   if (zoomBack) { images[1].style.transform = ''; images[1].style.transformOrigin = ''; }
   if (zoomBack) views[1].querySelector('figcaption').textContent = 'Back';
  }
  return enhanced;
 }
 function update() {
  if (!configure()) return;
  const rect = story.getBoundingClientRect();
  if (rect.top > window.innerHeight * 1.5 || rect.bottom < 0) return;
  prepare(0);
  const travel = Math.max(1, rect.height - stage.getBoundingClientRect().height);
  const progress = sceneClamp(((header?.getBoundingClientRect().bottom ?? 82) - rect.top) / travel) * views.length;
  // Prepare all intervening views on rapid scroll and the next view before it enters.
  for (let i=1;i<=Math.min(zoomBack ? 1 : 3,Math.floor(progress + .35));i++) prepare(i);
  const candidate = catalogStoryFrame(progress,zoomBack);
  if (candidate.weights.every((weight,i) => weight === 0 || decoded.has(images[i]))) settled = progress;
  const frame = catalogStoryFrame(settled,zoomBack);
  views.forEach((view,i) => {
   const sliding = !zoomBack || i < 2;
   view.style.opacity = String(sliding ? (frame.weights[i] > 0 ? 1 : 0) : frame.weights[i]);
   view.style.transform = sliding ? `translateX(${zoomBack ? (i === 0 ? frame.slide : frame.slide - 1) * 100 : frame.positions[i]}%)` : `translateY(${(1 - frame.weights[i]) * 16}px)`;
   view.setAttribute('aria-hidden', String(i !== frame.visualActive));
  });
  if (zoomBack) {
   const box = views[1].getBoundingClientRect();
   const image = images[1];
   const renderedHeight = Math.min(box.width / (image.naturalWidth || 1), box.height / (image.naturalHeight || 1)) * (image.naturalHeight || 1);
   const center = (box.height - renderedHeight) / 2 + renderedHeight * .35;
   image.style.transformOrigin = `50% ${center}px`;
   image.style.transform = `translateY(${(box.height / 2 - center) * frame.zoom}px) scale(${1 + frame.zoom * 1.2})`;
   views[1].querySelector('figcaption').textContent = frame.active === 2 ? 'Graphic detail' : 'Back';
  }
  steps.forEach((step,i) => { if(i === frame.active) step.setAttribute('aria-current','step'); else step.removeAttribute('aria-current'); });
 }
 const scene = registerScrollScene(story,update);
 motion.addEventListener('change', () => { configure(); scene.schedule(); });
 // Reconfigure offscreen stories too when a short viewport changes the layout.
 const resizeCatalog = () => { configure(); scene.schedule(); };
 window.addEventListener('resize',resizeCatalog);
 window.addEventListener('orientationchange',resizeCatalog);
 // Configure every story immediately so anchor geometry does not change on entry.
 configure(); scene.enable(true);
}
