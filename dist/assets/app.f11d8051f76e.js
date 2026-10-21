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
let pauseCarouselForDialog = () => {};
let resumeCarouselAfterDialog = () => {};
if (carousel) {
 const slides = [...carousel.querySelectorAll('.carousel-slide')];
 const dots = [...carousel.querySelectorAll('.carousel-dot')];
 const counter = carousel.querySelector('.carousel-position');
 const productLabel = carousel.querySelector('.carousel-current');
 const toggle = carousel.querySelector('.carousel-toggle');
 const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
 let index = 0;
 let timer;
 let userPaused = reducedMotion.matches;
 let hovering = false;
 let focused = false;
 let inView = false;
 let dialogOpen = false;
 function schedule() {
  clearTimeout(timer);
  const playing = !userPaused && !hovering && !focused && inView && !dialogOpen && !document.hidden;
  counter.setAttribute('aria-live', playing ? 'off' : 'polite');
  toggle.textContent = userPaused ? 'Play' : 'Pause';
  toggle.setAttribute('aria-label', userPaused ? 'Start automatic rotation' : 'Pause automatic rotation');
  if (playing) timer = setTimeout(() => { showSlide(index + 1); schedule(); }, 6000);
 }
 function showSlide(next) {
  index = (next + slides.length) % slides.length;
  slides.forEach((slide, i) => { slide.hidden = i !== index; });
  dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
  currentProduct = slides[index].dataset.product;
  productLabel.textContent = slides[index].dataset.label;
  counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
 }
 function manualSlide(next) { showSlide(next); schedule(); }
 carousel.querySelector('.carousel-prev').addEventListener('click', () => manualSlide(index - 1));
 carousel.querySelector('.carousel-next').addEventListener('click', () => manualSlide(index + 1));
 dots.forEach((dot, i) => dot.addEventListener('click', () => manualSlide(i)));
 toggle.addEventListener('click', () => { userPaused = !userPaused; schedule(); });
 carousel.addEventListener('mouseenter', () => { hovering = true; schedule(); });
 carousel.addEventListener('mouseleave', () => { hovering = false; schedule(); });
 carousel.addEventListener('focusin', () => { focused = true; schedule(); });
 carousel.addEventListener('focusout', event => { focused = carousel.contains(event.relatedTarget); schedule(); });
 document.addEventListener('visibilitychange', schedule);
 reducedMotion.addEventListener('change', event => { userPaused = event.matches; schedule(); });
 if ('IntersectionObserver' in window) {
  const observer = new window.IntersectionObserver(entries => { inView = entries[0].isIntersecting; schedule(); }, {threshold:0.25});
  observer.observe(carousel);
 } else { inView = true; }
 pauseCarouselForDialog = () => { dialogOpen = true; schedule(); };
 resumeCarouselAfterDialog = () => { dialogOpen = false; schedule(); };
 carousel.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); manualSlide(index + (event.key === 'ArrowRight' ? 1 : -1)); }
 });
 let start;
 carousel.addEventListener('touchstart', event => { start = {x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY}; clearTimeout(timer); }, {passive:true});
 carousel.addEventListener('touchend', event => {
  if (!start) return;
  const dx = event.changedTouches[0].clientX - start.x;
  const dy = event.changedTouches[0].clientY - start.y;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showSlide(index + (dx < 0 ? 1 : -1));
  start = null; schedule();
 }, {passive:true});
 carousel.addEventListener('touchcancel', () => { start = null; schedule(); });
 showSlide(0); schedule();
}
const dialog = document.querySelector('#interest-dialog');
if (dialog && typeof dialog.showModal === 'function') {
 let opener;
 const choices = [...dialog.querySelectorAll('[name="product_choices"]')];
 document.querySelectorAll('[data-interest]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); opener = link;
  const selected = link.dataset.interest === 'current' ? currentProduct : link.dataset.interest;
  choices.forEach(input => { input.checked = input.value === selected; input.setCustomValidity(''); });
  pauseCarouselForDialog(); dialog.showModal(); document.documentElement.classList.add('modal-open');
  choices.find(input => input.checked)?.focus();
 }));
 dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
 dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
 });
 dialog.addEventListener('close', () => { document.documentElement.classList.remove('modal-open'); opener?.focus(); resumeCarouselAfterDialog(); });
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
function productStoryFrame(progress) {
 const material = sceneEase((progress - 1) / 0.2);
 return {weights:[1 - material, material]};
}
function missionSceneFrame(top, height) {
 const progress = (height - top) / (height * 0.5);
 return {lines:[0,0.15,0.3].map(start => sceneEase((progress - start) / 0.7)), finish:sceneEase((progress - 0.45) / 0.55)};
}
function founderSceneFrame(top, bottom, titleTop, height) {
 const enter = sceneEase((height - top) / (height * 0.5));
 return {enter, copy:sceneEase((height - titleTop) / (height * 0.45)), glow:sceneEase((height * 0.85 - titleTop) / (height * 0.35)) * sceneEase(bottom / (height * 0.5))};
}
const productStory = document.querySelector('[data-product-story]');
if (productStory) {
 const moments = [...productStory.querySelectorAll('[data-product-moment]')];
 const steps = [...productStory.querySelectorAll('[data-product-step]')];
 const pictures = ['overview','mesh'].map(name => productStory.querySelector(`[data-product-image="${name}"]`));
 const images = pictures.map(picture => picture.querySelector('img'));
 const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 const header = document.querySelector('.header');
 let enhanced = false, lastProgress = 0;
 const ready = image => image.complete && image.naturalWidth > 0 && (!image.decode || image.dataset.decoded === 'true');
 function prepare(index) {
  const image = images[index];
  if (image.loading === 'lazy') image.loading = 'eager';
  if (!image.dataset.decoding) {
   image.dataset.decoding = 'true';
   image.decode?.().then(() => { image.dataset.decoded = 'true'; scene.schedule(); }).catch(() => {});
  }
 }
 function restore() {
  moments.forEach(moment => { moment.style.opacity = ''; moment.removeAttribute('aria-hidden'); moment.querySelector('.product-copy').style.transform = ''; });
  pictures.forEach(picture => { picture.style.opacity = ''; picture.style.transform = ''; });
 }
 function configure() {
  const shouldEnhance = !motion.matches && window.innerHeight >= 600;
  if (enhanced !== shouldEnhance) {
   enhanced = shouldEnhance; productStory.classList.toggle('product-story-ready', enhanced);
   if (!enhanced) restore();
  }
  productStory.style.setProperty('--scene-header', `${header?.getBoundingClientRect().height ?? 82}px`);
 }
 function update() {
  configure();
  if (!enhanced) return;
  const rect = productStory.getBoundingClientRect();
  const travel = rect.height - productStory.querySelector('.product-sticky').getBoundingClientRect().height;
  const progress = sceneClamp(((header?.getBoundingClientRect().bottom ?? 82) - rect.top) / Math.max(1, travel)) * 2;
  // Prepare the next view before its transition; hold the last ready frame on slow networks.
  if (progress > 0.5) prepare(1);
  const needed = progress > 1 ? 1 : 0;
  const settled = ready(images[needed]) ? progress : lastProgress;
  lastProgress = settled;
  const state = productStoryFrame(settled);
  moments.forEach((moment, i) => {
   moment.style.opacity = String(state.weights[i]);
   moment.setAttribute('aria-hidden', String(i !== (state.weights[1] >= .5 ? 1 : 0)));
   moment.querySelector('.product-copy').style.transform = `translateY(${(1 - state.weights[i]) * 20}px)`;
  });
  const active = state.weights[1] >= .5 ? 1 : 0;
  steps.forEach((step,i) => { if(i === active) step.setAttribute('aria-current','step'); else step.removeAttribute('aria-current'); });
  pictures[0].style.transform = '';
  const magnify = sceneEase((settled - 1) / .35);
  pictures[1].style.setProperty('--lens-reveal', String(magnify));
  pictures[1].style.setProperty('--lens-scale', String(.12 + .88 * magnify));
  pictures[1].style.setProperty('--lens-x', `${(1 - magnify) * 100}%`);
 }
 const scene = registerScrollScene(productStory, update);
 motion.addEventListener('change', () => { configure(); scene.schedule(); });
 configure(); prepare(0); scene.enable(true);
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
