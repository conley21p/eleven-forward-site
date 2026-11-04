const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const {render, products} = require('../tests/shopify-preview.cjs');

const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, 'dist'));
const config = JSON.parse(fs.readFileSync(path.join(root, 'src/config.json'), 'utf8'));
const legacyHome = new JSDOM(fs.readFileSync(path.join(output, 'index.html'), 'utf8')).window.document;
const signup = legacyHome.querySelector('#updates-form[data-enabled="true"]');
const pages = [
 ['/', 'Eleven Forward | Join the Movement'],
 ['/pages/survival-club', 'Survival Club | Eleven Forward', '/survival-club/'],
 ['/collections/shop', 'Shop | Eleven Forward'],
 ...products.map(product => [product.url, product.title + ' | Eleven Forward']),
];

function configureNewsletter(document) {
 for (const form of document.querySelectorAll('form[id^="Newsletter-"]')) {
  form.querySelectorAll('input[type="hidden"]').forEach(input => input.remove());
  form.querySelector('input[type="email"]').name = 'email';
  const consent = form.querySelector('.consent');
  consent.querySelector('input').name = 'marketing_consent';
  consent.querySelector('input').value = 'yes';
  if (signup) {
   form.action = signup.getAttribute('action');
   consent.querySelector('span').replaceChildren(...signup.querySelector('.consent span').cloneNode(true).childNodes);
   for (const field of signup.querySelectorAll('input[type="hidden"], .botcheck')) {
    form.prepend(field.cloneNode(true));
   }
  } else {
   form.removeAttribute('action');
   form.querySelectorAll('input, button').forEach(control => { control.disabled = true; });
   const status = document.createElement('p');
   status.className = 'form-status';
   status.textContent = 'Newsletter signup is coming soon.';
   form.prepend(status);
  }
 }
}

async function build() {
 const publicPaths = new Map(pages.map(([route,, publicPath]) => [route, publicPath || (route === '/' ? '/' : route + '/')]));
 const assetFolder = path.join(output, 'assets/shopify');
 fs.mkdirSync(assetFolder, {recursive:true});
 fs.cpSync(path.join(root, 'shopify-src/assets'), assetFolder, {recursive:true});
 for (const [route, title] of pages) {
  const publicPath = publicPaths.get(route);
  const html = await render(new URL(route, config.siteUrl), {staticOrigin:config.siteUrl});
  const dom = new JSDOM(html.replaceAll('/assets/', '/assets/shopify/'));
  const {document} = dom.window;
  document.title = title;
  document.querySelector('[rel="canonical"]').href = new URL(publicPath, config.siteUrl).href;
  if (!signup) {
   const robots = document.createElement('meta');
   robots.name = 'robots';
   robots.content = 'noindex, nofollow';
   document.head.append(robots);
  }
  for (const link of document.querySelectorAll('a[href]')) {
   const href = link.getAttribute('href');
   if (href === '/cart') link.remove();
   else if (publicPaths.has(href)) link.setAttribute('href', publicPaths.get(href));
  }
  document.querySelectorAll('form[action="/cart/add"]').forEach(form => form.removeAttribute('action'));
  configureNewsletter(document);
  const file = path.join(output, publicPath, 'index.html');
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, dom.serialize());
  dom.window.close();
 }
 const sitemap = path.join(output, 'sitemap.xml');
 const urls = [...publicPaths.values()].map(publicPath => {
  return '<url><loc>' + new URL(publicPath, config.siteUrl).href + '</loc></url>';
 });
 fs.writeFileSync(sitemap, '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join('') + '</urlset>\n');
 legacyHome.defaultView.close();
 console.log('Built Shopify layouts for the standalone storefront.');
}
build().catch(error => { console.error(error); process.exitCode = 1; });
