const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'),path = require('path');
const {JSDOM} = require(process.env.EF_TEST_MODULES ? path.join(process.env.EF_TEST_MODULES,'jsdom') : 'jsdom');
const {render} = require('./shopify-preview.cjs');
const code=fs.readFileSync(path.join(__dirname,'../shopify-src/assets/commerce.js'),'utf8');
async function setup(route='/pages/survival-club') {
 const dom=new JSDOM(await render(new URL(route,'https://fixture.test')), {url:'https://fixture.test'+route,runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.Image=class {decode(){return Promise.resolve();}};
 dom.window.eval(code);
 return {dom,picker:dom.window.document.querySelector('ef-product-picker')};
}
const selectSize=(picker,size)=>{const variant=picker.current.product.variants.find(v=>v.option1===size);picker.select.value=String(variant.id);picker.select.dispatchEvent(new picker.ownerDocument.defaultView.Event('change'));};
test('catalog contains exactly the three intended products and shop links',async()=>{
 const html=await render(new URL('/collections/shop','https://fixture.test'));
 const document=new JSDOM(html).window.document;
 assert.equal(document.querySelectorAll('.product-card').length,3);
 assert.equal(document.querySelectorAll('.product-card ef-product-picker[data-mode="quick"]').length,3);
 assert.equal(new Set([...document.querySelectorAll('.product-card select')].map(select=>select.id)).size,3);
 assert.deepEqual([...document.querySelectorAll('.product-card-title h2')].map(x=>x.textContent),['P001 Sport Band','Survival Club Tee — Black','Survival Club Tee — White']);
 assert.deepEqual(
  [...document.querySelectorAll('.nav-links a')].slice(1,3).map(link=>link.getAttribute('href')),
  ['/collections/shop','/pages/survival-club']
 );
 const home=await render(new URL('/','https://fixture.test'));
 assert.match(home,/products\/p001-sport-band">Shop now/);assert.doesNotMatch(home,/Get product updates/);
});
test('catalog modal uses the exact variant and the native cart funnel',async()=>{
 const dom=new JSDOM(await render(new URL('/collections/shop','https://fixture.test')),{url:'https://fixture.test/collections/shop',runScripts:'outside-only'});
 dom.window.eval(code);
 const picker=dom.window.document.querySelectorAll('ef-product-picker')[1];
 assert.equal(picker.variant.option1,'L');assert.equal(picker.add.disabled,false);selectSize(picker,'L');
 let sent;
 dom.window.fetch=async(url,options)=>{sent={url,id:options.body.get('id'),quantity:options.body.get('quantity')};return{ok:false,json:async()=>({description:'Fixture inventory response'})};};
 await picker.submit({preventDefault(){}});
 assert.deepEqual(sent,{url:'/cart/add.js',id:'203',quantity:'1'});
 assert.equal(picker.dataset.cartUrl,'/cart');assert.equal(picker.querySelector('[data-color-choice]'),null);dom.window.close();
});
test('local checkout preview is clearly labeled and collects no payment information',async()=>{
 const document=new JSDOM(await render(new URL('/checkout','https://fixture.test'))).window.document;
 assert.match(document.body.textContent,/does not collect payment details or place orders/);
 assert.equal(document.querySelector('input'),null);
});
test('Large is selected by default; empty and sold-out sizes cannot be bought',async()=>{
 const {dom,picker}=await setup();
 assert.equal(picker.variant.option1,'L');assert.equal(picker.add.disabled,false);
 picker.select.value='';picker.select.dispatchEvent(new dom.window.Event('change'));
 assert.equal(picker.add.disabled,true);
 selectSize(picker,'M');assert.equal(picker.add.disabled,true);assert.equal(picker.add.textContent,'Sold out');
 selectSize(picker,'S');assert.equal(picker.add.disabled,false);
 dom.window.close();
});
test('color change updates all images and retains the actual size',async()=>{
 const {dom,picker}=await setup();selectSize(picker,'L');
 await picker.changeColor('white');
 assert.equal(picker.variant.option1,'L');assert.equal(picker.variant.id,303);
 assert.equal(picker.color,'white');
 assert.ok([...dom.window.document.querySelectorAll('.catalog-gallery img')].every(img=>img.src.includes('club-white')));
 const before=picker.select.value;
 picker.querySelector('[data-fit="women"]').click();
 assert.equal(picker.select.value,before);assert.equal(picker.variant.price,3500);
 assert.equal(picker.querySelector('[data-guidance="women"]').hidden,false);
 dom.window.close();
});
test('missing size in other color clears selection; unavailable matching size stays unavailable',async()=>{
 const {dom,picker}=await setup();selectSize(picker,'L');
 picker.products.white.product.variants=picker.products.white.product.variants.filter(v=>v.option1!=='L');
 await picker.changeColor('white');assert.equal(picker.select.value,'');assert.equal(picker.add.disabled,true);
 await picker.changeColor('black');selectSize(picker,'S');picker.products.white.product.variants[0].available=false;
 await picker.changeColor('white');assert.equal(picker.variant.option1,'S');assert.equal(picker.add.disabled,true);
 dom.window.close();
});
test('failed image decode preserves selected color, size and visible assets',async()=>{
 const {dom,picker}=await setup();selectSize(picker,'S');
 const original=dom.window.document.querySelector('.catalog-gallery img').src;
 dom.window.Image=class {decode(){return Promise.reject(new Error('fixture image failure'));}};
 await picker.changeColor('white');
 assert.equal(picker.color,'black');assert.equal(picker.variant.id,201);
 assert.equal(dom.window.document.querySelector('.catalog-gallery img').src,original);
 assert.match(picker.status.textContent,/previous selection is unchanged/);
 dom.window.close();
});
test('unready and unconnected products remain Coming soon without fabricated prices',async()=>{
 for(const route of ['/pages/survival-club?unready=1','/pages/survival-club?unconnected=1']){
  const {dom,picker}=await setup(route);assert.equal(picker.add.disabled,true);assert.equal(picker.add.textContent,'Coming soon');
  assert.equal(picker.querySelector('[data-price]').textContent,'Price to be announced');
  await picker.changeColor('white');assert.equal(picker.add.disabled,true);dom.window.close();
 }
});
test('cart stock error preserves selection; no automatic retry occurs',async()=>{
 const {dom,picker}=await setup();selectSize(picker,'S');let calls=0;
 dom.window.fetch=async()=>{calls++;return {ok:false,json:async()=>({description:'Sold out since selection.'})};};
 await picker.submit({preventDefault(){}});
 assert.equal(calls,1);assert.equal(picker.variant.id,201);assert.match(picker.status.textContent,/Sold out since selection/);
 dom.window.close();
});
test('rapid repeat submits produce one request and navigate only after success',async()=>{
 const {dom,picker}=await setup();selectSize(picker,'S');let calls=0,finish;
 picker.dataset.cartUrl='#cart';
 dom.window.fetch=()=>{calls++;return new Promise(resolve=>{finish=()=>resolve({ok:true,json:async()=>({id:201})});});};
 const first=picker.submit({preventDefault(){}});const second=picker.submit({preventDefault(){}});
 assert.equal(calls,1);assert.equal(picker.pending,true);finish();await Promise.all([first,second]);
 assert.equal(dom.window.location.hash,'#cart');assert.equal(calls,1);dom.window.close();
});
test('network uncertainty asks shopper to inspect cart without repeating add',async()=>{
 const {dom,picker}=await setup();selectSize(picker,'S');let calls=0;
 dom.window.fetch=async()=>{calls++;throw new Error('fixture timeout');};
 await picker.submit({preventDefault(){}});assert.equal(calls,1);assert.match(picker.status.textContent,/Check your cart/);assert.equal(picker.variant.id,201);dom.window.close();
});
test('product detail deep link selects variant and unlocks accelerated checkout',async()=>{
 const {dom,picker}=await setup('/products/survival-club-tee-black?variant=203');
 assert.equal(picker.variant.id,203);assert.equal(picker.querySelector('[data-accelerated]').hidden,false);
 selectSize(picker,'S');assert.equal(dom.window.location.search,'?variant=201');dom.window.close();
});
test('disconnected and reconnected picker does not accumulate click handlers',async()=>{
 const {dom,picker}=await setup();const parent=picker.parentElement;
 picker.remove();parent.append(picker);
 picker.querySelector('[data-fit="women"]').click();assert.equal(picker.querySelector('[data-guidance="women"]').hidden,false);
 dom.window.close();
});
test('scroll scenes release observers on section unload and initialize once on reload',async()=>{
 const {dom}=await setup();let observers=0;
 dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 const Observer=class{constructor(){observers++;}observe(){}disconnect(){observers--;}};
 dom.window.IntersectionObserver=Observer;dom.window.ResizeObserver=Observer;
 dom.window.eval(fs.readFileSync(path.join(__dirname,'../shopify-src/assets/eleven.js'),'utf8'));
 assert.equal(observers,2);
 const section=dom.window.document.querySelector('.shopify-section');
 section.dispatchEvent(new dom.window.CustomEvent('shopify:section:unload',{bubbles:true}));assert.equal(observers,0);
 section.dispatchEvent(new dom.window.CustomEvent('shopify:section:load',{bubbles:true}));assert.equal(observers,2);
 section.dispatchEvent(new dom.window.CustomEvent('shopify:section:load',{bubbles:true}));assert.equal(observers,2);
 section.dispatchEvent(new dom.window.CustomEvent('shopify:section:unload',{bubbles:true}));assert.equal(observers,0);dom.window.close();
});
test('reduced motion and short viewports use a normal gallery',async()=>{
 for(const reduced of [true,false]){
  const {dom}=await setup();dom.window.matchMedia=()=>({matches:reduced,addEventListener(){},removeEventListener(){}});
  if(!reduced)dom.window.innerHeight=500;
  dom.window.eval(fs.readFileSync(path.join(__dirname,'../shopify-src/assets/eleven.js'),'utf8'));
  assert.equal(dom.window.document.querySelector('[data-commerce-story]').classList.contains('catalog-ready'),false);dom.window.close();
 }
});

test('stacked purchase controls retain the scroll story and restore on resize and unload',async()=>{
 const {dom,picker}=await setup(),{window}=dom;
 const story=window.document.querySelector('[data-commerce-story]'),stage=story.querySelector('.catalog-sticky');
 const bar=story.querySelector('.catalog-bottom');
 window.innerWidth=710;window.innerHeight=800;
 window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 window.document.querySelector('.header').getBoundingClientRect=()=>({height:83,bottom:83});
 story.querySelector('.catalog-copy').getBoundingClientRect=()=>({height:120});
 bar.getBoundingClientRect=()=>({height:421});
 window.eval(fs.readFileSync(path.join(__dirname,'../shopify-src/assets/eleven.js'),'utf8'));
 assert.ok(story.classList.contains('catalog-ready'));
 assert.ok(story.classList.contains('catalog-controls-flow'));
 assert.equal(stage.parentElement.className,'catalog-animation-track');assert.equal(bar.parentElement,story);
 await picker.changeColor('white');assert.equal(story.dataset.color,'white');
 window.innerHeight=904;window.dispatchEvent(new window.Event('resize'));
 assert.ok(story.classList.contains('catalog-ready'));assert.equal(bar.parentElement,stage);
 assert.equal(story.classList.contains('catalog-controls-flow'),false);
 window.innerWidth=1280;bar.getBoundingClientRect=()=>({height:109});
 window.dispatchEvent(new window.Event('resize'));
 assert.equal(story.classList.contains('catalog-controls-flow'),false);assert.equal(bar.parentElement,stage);
 window.innerWidth=710;window.innerHeight=800;bar.getBoundingClientRect=()=>({height:421});window.dispatchEvent(new window.Event('resize'));
 story.closest('.shopify-section').dispatchEvent(new window.CustomEvent('shopify:section:unload',{bubbles:true}));
 assert.equal(bar.parentElement,stage);assert.equal(story.querySelector('.catalog-animation-track'),null);
 dom.window.close();
});

test('product recommendations link only to assigned complementary products',async()=>{
 for(const [handle,expected] of [
  ['survival-club-tee-black',['P001 Sport Band']],
  ['survival-club-tee-white',['P001 Sport Band']],
  ['p001-sport-band',['Survival Club Tee — Black','Survival Club Tee — White']]
 ]){
  const document=new JSDOM(await render(new URL('/products/'+handle,'https://fixture.test'))).window.document;
  const section=document.querySelector('.product-recommendations');
  assert.deepEqual([...section.querySelectorAll('.product-card h2')].map(el=>el.textContent),expected);
  assert.equal(section.querySelector('ef-product-picker'),null);
  assert.equal(section.querySelector('button'),null);
 }
 const missing=new JSDOM(await render(new URL('/products/p001-sport-band?unconnected=1','https://fixture.test'))).window.document;
 assert.equal(missing.querySelector('.product-recommendations'),null);
});
test('black gallery preserves back position and adds chest close-up last',async()=>{
 const {dom}=await setup('/products/survival-club-tee-black');
 const buttons=[...dom.window.document.querySelectorAll('[data-image-url]')];
 assert.equal(buttons.length,4);
 assert.match(buttons[1].dataset.imageUrl,/black-back/);
 assert.match(buttons[3].dataset.imageUrl,/black-front-detail/);
 buttons[3].click();await new Promise(resolve=>setImmediate(resolve));
 assert.match(dom.window.document.querySelector('[data-main-image] img').src,/black-front-detail/);
 dom.window.close();
});
test('quantity controls enforce minimums, support edits, and send the chosen quantity',async()=>{
 const {dom,picker}=await setup('/products/p001-sport-band');
 const quantity=picker.querySelector('ef-quantity'),input=quantity.querySelector('input');
 const minus=quantity.querySelector('[data-quantity-step="-1"]'),plus=quantity.querySelector('[data-quantity-step="1"]');
 assert.equal(minus.disabled,true);plus.click();assert.equal(input.value,'2');assert.equal(minus.disabled,false);
 input.value='4';input.dispatchEvent(new dom.window.Event('input'));minus.click();assert.equal(input.value,'3');
 let sent;dom.window.fetch=async(url,options)=>{sent=options.body.get('quantity');return {ok:false,json:async()=>({description:'Fixture response'})};};
 await picker.submit({preventDefault(){}});assert.equal(sent,'3');
 input.value='0';assert.equal(picker.form.checkValidity(),false);
 // The same control permits zero on cart forms and retains the native updates[] field.
 input.min='0';input.name='updates[]';input.value='1';input.dispatchEvent(new dom.window.Event('input'));minus.click();
 assert.equal(input.value,'0');assert.equal(minus.disabled,true);assert.equal(input.name,'updates[]');
 quantity.remove();dom.window.document.body.append(quantity);plus.click();assert.equal(input.value,'1');
 dom.window.close();
});

test('pending purchases lock controls and restore them after an error',async()=>{
 const {dom,picker}=await setup('/products/survival-club-tee-black');
 const quantity=picker.querySelector('ef-quantity'),input=quantity.querySelector('input');
 input.value='3';let finish,sent;
 dom.window.fetch=(url,options)=>{sent={id:options.body.get('id'),quantity:options.body.get('quantity')};return new Promise(resolve=>{finish=()=>resolve({ok:false,json:async()=>({description:'Try again'})});});};
 const submission=picker.submit({preventDefault(){}});
 assert.deepEqual(sent,{id:'203',quantity:'3'});
 assert.equal(picker.select.disabled,true);assert.equal(input.readOnly,true);
 assert.equal(quantity.querySelector('[data-quantity-step="1"]').disabled,true);
 assert.equal(picker.querySelector('[data-color-choice]').disabled,true);
 assert.equal(picker.add.getAttribute('aria-busy'),'true');
 await picker.changeColor('white');assert.equal(picker.color,'black');
 finish();await submission;
 assert.equal(picker.select.disabled,false);assert.equal(input.readOnly,false);
 assert.equal(input.value,'3');assert.equal(picker.variant.id,203);
 assert.equal(picker.add.getAttribute('aria-busy'),'false');dom.window.close();
});
test('quantity commits normalize empty, decimal and out-of-range values',async()=>{
 const {dom,picker}=await setup('/products/p001-sport-band');
 const input=picker.querySelector('ef-quantity input');input.max='5';
 for(const [value,expected] of [['','1'],['-2','1'],['2.8','2'],['99','5']]){
  input.value=value;input.dispatchEvent(new dom.window.Event('change'));
  assert.equal(input.value,expected);assert.equal(input.checkValidity(),true);
 }
 assert.equal(picker.querySelector('[data-quantity-step="1"]').disabled,true);dom.window.close();
});

test('quick shop presents gender and size together and restores focus on dismissal',async()=>{
 const {dom}=await setup('/collections/shop');
 const quick=dom.window.document.querySelectorAll('ef-quick-shop')[1];
 const dialog=quick.querySelector('dialog'),opener=quick.querySelector('[data-quick-open]');
 dialog.showModal=()=>dialog.setAttribute('open','');
 dialog.close=()=>{dialog.removeAttribute('open');dialog.dispatchEvent(new dom.window.Event('close'));};
 opener.click();assert.equal(dialog.open,true);
 assert.equal(quick.querySelector('[data-quick-next]'),null);assert.equal(quick.querySelector('[data-quick-back]'),null);
 assert.equal(quick.querySelector('.quick-steps'),null);
 const picker=quick.querySelector('ef-product-picker');assert.equal(picker.variant.id,203);
 quick.querySelector('[data-quick-gender="women"]').click();assert.equal(quick.gender,'women');assert.equal(picker.variant.id,203);
 assert.equal(quick.querySelector('[data-variant]').closest('[hidden]'),null);
 quick.querySelector('[data-quick-close]').click();assert.equal(dialog.open,false);
 assert.equal(dom.window.document.activeElement,opener);
 assert.equal(dom.window.document.documentElement.classList.contains('quick-shop-open'),false);dom.window.close();
});
test('quick-shop links work without dialog support and unready cards cannot open a purchase',async()=>{
 const {dom}=await setup('/collections/shop');
 const quick=dom.window.document.querySelector('ef-quick-shop'),opener=quick.querySelector('[data-quick-open]');
 assert.equal(opener.getAttribute('href'),'/products/p001-sport-band');
 let intercepted;opener.addEventListener('click',event=>{intercepted=event.defaultPrevented;event.preventDefault();},{once:true});
 const event=new dom.window.MouseEvent('click',{bubbles:true,cancelable:true});opener.dispatchEvent(event);assert.equal(intercepted,false);
 const document=new JSDOM(await render(new URL('/collections/shop?unready=1','https://fixture.test'))).window.document;
 assert.equal(document.querySelector('dialog'),null);assert.equal(document.querySelectorAll('.quick-card-actions button:disabled').length,3);
 dom.window.close();
});

test('band fit switches real grouped variants and displays only supplied waist ranges',async()=>{
 const {dom}=await setup('/collections/shop');
 const quick=dom.window.document.querySelector('ef-quick-shop'),picker=quick.querySelector('ef-product-picker');
 assert.equal(picker.variant.option2,'L/XL');
 assert.deepEqual([...picker.select.options].slice(1).map(option=>option.textContent),['S/M — 25–35 in','L/XL — 35–45 in']);
 quick.querySelector('[data-quick-gender="women"]').click();
 assert.deepEqual([...picker.select.options].slice(1).map(option=>option.textContent),['XS/S — 24–29 in','M/L — 29–35 in','XL/XXL — 35–43 in — Sold out']);
 assert.equal(picker.select.value,'');assert.equal(picker.add.disabled,true);
 picker.select.value='104';picker.select.dispatchEvent(new dom.window.Event('change'));
 assert.equal(picker.variant.option1,'Women’s');assert.equal(picker.variant.option2,'M/L');assert.equal(picker.add.disabled,false);
 let sent;dom.window.fetch=async(url,options)=>{sent=options.body.get('id');return{ok:false,json:async()=>({description:'Fixture stock response'})};};
 await picker.submit({preventDefault(){}});assert.equal(sent,'104');
 picker.current.waist_ranges.men['S/M']='24–28';picker.setBandGender('men');
 assert.equal(picker.select.options[1].textContent,'S/M — 24–28 in');
 assert.equal(picker.select.options[1].value,'101');dom.window.close();
});
test('missing grouped band variants remain unavailable instead of relabeling old sizes',async()=>{
 const {dom,picker}=await setup('/products/p001-sport-band');
 picker.current.product.variants=[{id:9001,title:'S',option1:'S',options:['S'],available:true}];
 picker.setBandGender('men');assert.equal(picker.select.value,'');assert.equal(picker.add.disabled,true);
 assert.deepEqual([...picker.select.options].slice(1).map(option=>option.textContent),['S/M — Coming soon','L/XL — Coming soon']);
 dom.window.close();
});

test('band product dropdowns keep sizes concise while the guide holds waist estimates',async()=>{
 const {dom,picker}=await setup('/products/p001-sport-band');
 assert.equal(picker.select.options[1].textContent,'S/M');
 picker.querySelector('[data-band-gender="women"]').click();
 assert.equal(picker.select.options[1].textContent,'XS/S');
 assert.equal(picker.querySelector('.band-waist-note').textContent,'Sample sizing');
 assert.equal(picker.add.disabled,true);dom.window.close();
});

test('band size-guide sheet follows fit and selected size and restores focus',async()=>{
 const {dom,picker}=await setup('/products/p001-sport-band?variant=104');
 const dialog=picker.querySelector('[data-band-guide-dialog]'),opener=picker.querySelector('[data-band-guide]');
 dialog.showModal=()=>dialog.setAttribute('open','');dialog.close=()=>{dialog.removeAttribute('open');dialog.dispatchEvent(new dom.window.Event('close'));};
 assert.equal(picker.querySelector('[data-price]').textContent,'$35.00');
 assert.equal(picker.querySelector('form [data-price]'),null);
 assert.equal(picker.select.selectedOptions[0].textContent,'M/L');
 opener.click();assert.equal(dialog.open,true);
 assert.equal(dialog.querySelector('[data-band-guide-product]').textContent,'P001 Sport Band · Women’s');
 assert.deepEqual([...dialog.querySelectorAll('tbody td')].map(el=>el.textContent),['XS/S','24–29 in','M/L','29–35 in','XL/XXL','35–43 in']);
 picker.querySelector('[data-band-guide-close]').click();assert.equal(dialog.open,false);
 assert.equal(dom.window.document.activeElement,opener);
 picker.setBandGender('men');opener.click();
 assert.equal(dialog.querySelectorAll('tbody tr').length,2);
 assert.deepEqual([...dialog.querySelectorAll('tbody td')].map(el=>el.textContent),['S/M','25–35 in','L/XL','35–45 in']);
 assert.equal(dialog.querySelector('[data-band-guide-product]').textContent,'P001 Sport Band · Men’s');
 picker.querySelector('[data-band-guide-close]').click();
 assert.equal(dom.window.document.documentElement.classList.contains('band-guide-open'),false);dom.window.close();
});

test('account links use full-page authentication and remain outside mobile navigation',async()=>{
 const document=new JSDOM(await render(new URL('/','https://fixture.test'))).window.document;
 assert.equal(document.querySelector('shopify-account'),null);
 assert.equal(document.querySelector('.account-fallback').getAttribute('target'),'_top');
 assert.equal(document.querySelector('.account-fallback').getAttribute('href'),'/customer_authentication/login?return_to=%2F');
 assert.equal(document.querySelector('.account-fallback').textContent,'Login');
 const signedIn=new JSDOM(await render(new URL('/?state=signed-in','https://fixture.test'))).window.document;
 assert.equal(signedIn.querySelector('shopify-account'),null);
 assert.match(signedIn.querySelector('.account-menu summary').textContent,/Profile/);
 assert.deepEqual([...signedIn.querySelectorAll('.account-menu-links a')].map(a=>[a.textContent,a.getAttribute('href')]),[['Profile','/account/profile'],['Sign out','/account/logout']]);
 assert.equal(document.querySelector('.nav-links .account-entry'),null);
 const disabled=await render(new URL('/?accounts_disabled','https://fixture.test'));
 assert.doesNotMatch(disabled,/<shopify-account/);
});
test('newsletter forms have distinct IDs and explicit unchecked consent',async()=>{
 const document=new JSDOM(await render(new URL('/','https://fixture.test'))).window.document;
 const forms=[...document.querySelectorAll('form[action="/contact"]')];assert.equal(forms.length,1);
 assert.equal(document.querySelector('#updates-home'),null);
 const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
 forms.forEach(form=>{const consent=form.querySelector('input[type="checkbox"]');assert.equal(consent.checked,false);assert.equal(consent.required,true);assert.equal(form.querySelector('[name="contact[email]"]').required,true);});
 assert.equal(new JSDOM(await render(new URL('/collections/shop','https://fixture.test'))).window.document.querySelectorAll('form[action="/contact"]').length,1);
 assert.doesNotMatch(await render(new URL('/?newsletter_off','https://fixture.test')),/form id="Newsletter-/);
});
test('newsletter confirmation and errors are scoped to the submitted placement',async()=>{
 const pending=new JSDOM(await render(new URL('/?newsletter_source=footer&newsletter=pending','https://fixture.test'))).window.document;
 assert.match(pending.querySelector('#Newsletter-footer').textContent,/Check your email/);
 assert.equal(pending.querySelector('#Newsletter-home'),null);
 const errors=new JSDOM(await render(new URL('/?newsletter_source=footer&newsletter=error','https://fixture.test'))).window.document;
 assert.equal(errors.querySelector('#Newsletter-footer-email').getAttribute('aria-invalid'),'true');
 assert.ok(errors.querySelector('#Newsletter-footer-error[role="alert"]'));
});
test('local account fixtures expose mock states without authentication or email sending',async()=>{
 for(const subscription of ['pending','subscribed','unsubscribed']){
  const html=await render(new URL('/account?state=signed-in&subscription='+subscription,'https://fixture.test'));
  assert.match(html,/does not authenticate customers/);assert.match(html,/role="status"/);assert.doesNotMatch(html,/type="password"/);
 }
});
test('newsletter enhancement blocks duplicate posts and resets after history restore',async()=>{
 const dom=new JSDOM(await render(new URL('/','https://fixture.test')),{runScripts:'outside-only'});
 dom.window.eval(fs.readFileSync(path.join(__dirname,'../shopify-src/assets/customer-engagement.js'),'utf8'));
 const form=dom.window.document.querySelector('#Newsletter-footer');
 const post=()=>{const event=new dom.window.Event('submit',{bubbles:true,cancelable:true});form.dispatchEvent(event);return event;};
 assert.equal(post().defaultPrevented,false);assert.equal(form.querySelector('button').disabled,true);
 assert.equal(post().defaultPrevented,true);
 dom.window.dispatchEvent(new dom.window.Event('pageshow'));assert.equal(form.querySelector('button').disabled,false);
 assert.equal(form.hasAttribute('aria-busy'),false);assert.equal(post().defaultPrevented,false);dom.window.close();
});

test('builder preserves Shopify comment headers and store settings across rebuilds',()=>{
 const {spawnSync}=require('node:child_process');
 const temp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'ef-build-settings-'));
 try {
  fs.mkdirSync(path.join(temp,'scripts'));
  fs.mkdirSync(path.join(temp,'shopify-src/config'),{recursive:true});
  fs.copyFileSync(path.join(__dirname,'../scripts/build_shopify_theme.py'),path.join(temp,'scripts/build_shopify_theme.py'));
  fs.writeFileSync(path.join(temp,'shopify-src/config/settings_data.json'),'{"current":{"enable_newsletter":false}}');
  const storeSettings='/* Shopify auto-generated settings */\n'+JSON.stringify({current:{enable_newsletter:true,band_product:'existing-band',support_url:'https://example.test/a/*literal*/b'},presets:{}});
  const input=path.join(temp,'store-settings.json');fs.writeFileSync(input,storeSettings);
  for (const args of [['--settings-file',input],[]]) {
   const result=spawnSync('python3',[path.join(temp,'scripts/build_shopify_theme.py'),...args],{encoding:'utf8'});
   assert.equal(result.status,0,result.stderr);
   assert.equal(fs.readFileSync(path.join(temp,'shopify-theme/config/settings_data.json'),'utf8'),storeSettings);
  }
  fs.writeFileSync(input,'/* Shopify header */\n{invalid json}');
  const invalid=spawnSync('python3',[path.join(temp,'scripts/build_shopify_theme.py'),'--settings-file',input],{encoding:'utf8'});
  assert.notEqual(invalid.status,0);
  assert.equal(fs.readFileSync(path.join(temp,'shopify-theme/config/settings_data.json'),'utf8'),storeSettings);
 } finally {fs.rmSync(temp,{recursive:true,force:true});}
});

test('Shop uses shared catalog fallback images through both Shopify collection templates',async()=>{
 for (const template of ['', '&collection_template=shop']) {
  const doc=new JSDOM(await render(new URL('/collections/shop?no_product_images=1&unready=1'+template,'https://fixture.test'))).window.document;
  assert.ok(doc.querySelector('.catalog-shop'));
  const cards=[...doc.querySelectorAll('.product-card')];
  assert.equal(cards.length,3);
  assert.deepEqual(cards.map(card=>card.querySelector('.product-card-image > img')?.getAttribute('src')),['/assets/product-woven-1100.webp','/assets/club-black-front-cutout-800.webp','/assets/club-white-front-cutout-800.webp']);
  assert.deepEqual(cards.slice(1).map(card=>card.querySelector('.product-card-back img')?.getAttribute('src')),['/assets/club-black-back-cutout-800.webp','/assets/club-white-back-cutout-800.webp']);
  for (const img of doc.querySelectorAll('.product-card img')) assert.ok(fs.existsSync(path.join(__dirname,'../shopify-src',img.getAttribute('src').replace(/^\//,''))));
  assert.equal(doc.querySelectorAll('[data-open-quick-shop]').length,0);
 }
});

test('Survival Club cue follows the visible shirt side and relocated details follow color',async()=>{
 const {dom,picker}=await setup();
 const {window}=dom,story=window.document.querySelector('[data-commerce-story]');
 assert.equal(picker.querySelector('[data-product-link]'),null);
 const details=story.querySelector('.catalog-title-row [data-product-link]');assert.ok(details);
 assert.equal(story.querySelector('.catalog-scroll-cue').getAttribute('aria-hidden'),'true');
 assert.equal(story.querySelectorAll('.catalog-scroll-arrows i').length,2);
 assert.ok(picker.querySelector('form .story-purchase-action [data-add]'));
 let progress=.5,queue=[];
 window.innerWidth=1200;window.innerHeight=1000;
 window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 window.requestAnimationFrame=callback=>{queue.push(callback);return queue.length;};
 window.cancelAnimationFrame=()=>{queue=[];};
 window.document.querySelector('.header').getBoundingClientRect=()=>({height:82,bottom:82});
 story.getBoundingClientRect=()=>({top:82-progress/4*2100,bottom:3082-progress/4*2100,height:3000});
 story.querySelector('.catalog-sticky').getBoundingClientRect=()=>({height:900});
 story.querySelector('.catalog-copy').getBoundingClientRect=()=>({height:100});
 story.querySelector('.catalog-bottom').getBoundingClientRect=()=>({height:100});
 story.querySelectorAll('[data-catalog-view]').forEach(view=>{
  view.getBoundingClientRect=()=>({width:900,height:500});
  const img=view.querySelector('img');img.decode=()=>Promise.resolve();
  Object.defineProperty(img,'naturalWidth',{value:1254});Object.defineProperty(img,'naturalHeight',{value:1254});
 });
 const flush=async()=>{for(let i=0;i<6;i++){const callbacks=queue;queue=[];callbacks.forEach(callback=>callback());await new Promise(resolve=>setImmediate(resolve));}};
 window.eval(fs.readFileSync(path.join(__dirname,'../shopify-src/assets/eleven.js'),'utf8'));
 await flush();assert.equal(story.dataset.scrollDirection,'down');
 progress=3.5;window.dispatchEvent(new window.Event('scroll'));await flush();assert.equal(story.dataset.scrollDirection,'up');
 await picker.changeColor('white');await flush();assert.equal(story.dataset.scrollDirection,'up');assert.equal(details.getAttribute('href'),'/products/survival-club-tee-white');
 progress=.5;window.dispatchEvent(new window.Event('scroll'));await flush();assert.equal(story.dataset.scrollDirection,'down');
 dom.window.close();
});


test('account refresh uses Shopify-rendered state and preserves the control on failure',async()=>{
 const dom=new JSDOM(await render(new URL('/','https://fixture.test')),{url:'https://fixture.test/',runScripts:'outside-only',pretendToBeVisual:true});
 const signedIn=new JSDOM(await render(new URL('/?state=signed-in','https://fixture.test'))).window.document.querySelector('[data-account-entry]').outerHTML;
 let calls=0,fail=false;
 dom.window.fetch=async(url,options)=>{
  calls++;assert.equal(new URL(url).searchParams.get('sections'),'customer-account-state');assert.equal(options.credentials,'same-origin');
  if(fail) throw new Error('offline');
  return {ok:true,json:async()=>({'customer-account-state':signedIn})};
 };
 dom.window.eval(fs.readFileSync(path.join(__dirname,'../shopify-src/assets/customer-engagement.js'),'utf8'));
 dom.window.dispatchEvent(new dom.window.PageTransitionEvent('pageshow',{persisted:true}));
 dom.window.dispatchEvent(new dom.window.Event('focus'));
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(calls,1);
 const menu=dom.window.document.querySelector('.account-menu');assert.ok(menu);
 menu.open=true;dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(menu.open,false);
 assert.equal(dom.window.document.activeElement,menu.querySelector('summary'));
 menu.open=true;dom.window.document.body.click();assert.equal(menu.open,false);
 fail=true;dom.window.dispatchEvent(new dom.window.Event('focus'));await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(dom.window.document.querySelector('.account-menu'),menu);dom.window.close();
});
test('Shopify account shopping destination frontpage leads to the complete shop catalog',async()=>{
 const document=new JSDOM(await render(new URL('/collections/frontpage?no_product_images','https://fixture.test'))).window.document;
 assert.equal(document.querySelector('[data-catalog-redirect]').dataset.catalogRedirect,'/collections/shop');
 assert.equal(document.querySelectorAll('.product-card').length,3);
 assert.ok(document.querySelector('.product-card img'));
});


test('cart uses assigned fallback images and one lower Continue shopping link',async()=>{
 const document=new JSDOM(await render(new URL('/cart?cart_fixture&no_product_images','https://fixture.test'))).window.document;
 assert.deepEqual([...document.querySelectorAll('.cart-item-image img')].map(img=>img.getAttribute('src')),['/assets/product-woven-1100.webp','/assets/club-black-front-cutout-800.webp','/assets/club-white-front-cutout-800.webp']);
 const links=[...document.querySelectorAll('.cart-page a')].filter(a=>a.textContent==='Continue shopping');
 assert.equal(links.length,1);assert.equal(links[0].getAttribute('href'),'/collections/shop');assert.equal(document.querySelector('.cart-heading a'),null);
 const native=new JSDOM(await render(new URL('/cart?cart_fixture','https://fixture.test'))).window.document;
 assert.equal(native.querySelector('.cart-item-image img').getAttribute('src'),'/assets/product-woven-1100.webp');
 assert.ok(document.querySelector('noscript').textContent.includes('Update quantities') || document.querySelector('noscript button'));
});
test('cart quantity changes submit native updates once and recover on history return',async()=>{
 const dom=new JSDOM(await render(new URL('/cart?cart_fixture','https://fixture.test')),{runScripts:'outside-only',url:'https://fixture.test/cart'});
 dom.window.eval(code);
 const form=dom.window.document.querySelector('[data-cart-form]');let submissions=[];
 form.requestSubmit=submitter=>{
  assert.equal(submitter.name,'update');
  const event=new dom.window.Event('submit',{bubbles:true,cancelable:true});form.dispatchEvent(event);
  if(!event.defaultPrevented) submissions.push([...new dom.window.FormData(form).getAll('updates[]')]);
 };
 const input=form.querySelector('input[name="updates[]"]');input.value='0';input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.equal(submissions.length,1);assert.equal(submissions[0][0],'0');assert.equal(input.disabled,false);assert.equal(input.readOnly,true);
 input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));assert.equal(submissions.length,1);
 dom.window.dispatchEvent(new dom.window.Event('pageshow'));assert.equal(input.readOnly,false);
 input.value='2';input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));assert.equal(submissions.length,2);assert.equal(submissions[1][0],'2');dom.window.close();
});

test('tee fit keeps the guide closed and detail color changes preserve the document', async () => {
 const {dom, picker} = await setup('/products/survival-club-tee-black?variant=203');
 const {document} = dom.window;
 const dialog = picker.querySelector('[data-size-guide-dialog]');
 dialog.showModal = () => dialog.setAttribute('open', '');
 picker.querySelector('[data-fit="women"]').click();
 assert.equal(dialog.open, false);
 picker.querySelector('[data-size-guide-open]').click();
 assert.equal(dialog.open, true);
 assert.equal(dialog.querySelector('[data-guidance="women"]').hidden, false);
 dialog.close = () => dialog.removeAttribute('open');
 dialog.close();
 const header = document.querySelector('.header');
 let requested;
 dom.window.fetch = async url => {
  requested = url.href;
  return {ok:true, text:() => render(url)};
 };
 await picker.changeColor('white');
 const updated = document.querySelector('ef-product-picker');
 assert.match(requested, /survival-club-tee-white\?variant=303$/);
 assert.equal(document.querySelector('.header'), header);
 assert.match(document.querySelector('h1').textContent, /White/);
 assert.equal(updated.variant.id, 303);
 assert.equal(updated.querySelector('[data-fit="women"]').getAttribute('aria-pressed'), 'true');
 assert.equal(updated.querySelector('[data-size-guide-dialog]').open, false);
 assert.equal(dom.window.location.pathname, '/products/survival-club-tee-white');
 dom.window.close();
});
