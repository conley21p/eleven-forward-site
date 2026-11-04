/* Local-only Shopify rendering fixture. Never included in the theme ZIP.
 * Run npm ci, then npm run preview:shopify. EF_TEST_MODULES is an optional override.
 * node tests/shopify-preview.cjs serves at 4174; no live Shopify requests.
 */
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const {Liquid} = require(process.env.EF_TEST_MODULES ? path.join(process.env.EF_TEST_MODULES,'liquidjs') : 'liquidjs');
const project = path.resolve(__dirname,'..'), source = path.join(project,'shopify-src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'ef-liquid-'));
function syncSources() {
for (const folder of ['sections','snippets','layout']) {
 fs.mkdirSync(path.join(temp,folder),{recursive:true});
 for (const file of fs.readdirSync(path.join(source,folder))) {
  const text = fs.readFileSync(path.join(source,folder,file),'utf8')
   .replace(/{% schema %}[\s\S]*?{% endschema %}/g,'')
   .replace(/{% form 'customer'[^%]*%}/g,'{% assign form = preview_forms[newsletter_key] %}<form id="{{ newsletter_form_id }}" action="/contact" method="post">')
   .replace(/{% form 'product'[^%]*%}/g,'<form action="/cart/add" method="post" class="purchase-form">')
   .replace(/{% form 'storefront_password'[^%]*%}/g,'<form>')
   .replace(/{% endform %}/g,'</form>')
   .replace(/{% paginate [^%]*%}/g,'').replace(/{% endpaginate %}/g,'');
  fs.writeFileSync(path.join(temp,folder,file),text);
 }
}
}
syncSources();
const engine = new Liquid({root:[path.join(temp,'snippets'),path.join(temp,'sections'),path.join(temp,'layout')],extname:'.liquid'});
engine.registerFilter('json',value=>JSON.stringify(value ?? null));
engine.registerFilter('asset_url',name=>'/assets/'+name);
engine.registerFilter('money_with_currency',cents=>'$'+(Number(cents)/100).toFixed(2)+' USD');
engine.registerFilter('money',cents=>'$'+(Number(cents)/100).toFixed(2));
engine.registerFilter('image_url',image=>typeof image==='string'?image:image?.src || '');
engine.registerFilter('image_tag',src=>`<img src="${src}" width="1200" height="1200" alt="">`);
engine.registerFilter('metafield_tag',v=>`<p>${v?.value || ''}</p>`);
engine.registerFilter('payment_button',()=>'<button type="button" data-test-accelerated>Buy it now</button>');
engine.registerFilter('stylesheet_tag',url=>`<link rel="stylesheet" href="${url}">`);
engine.registerFilter('default_errors',()=> '<p>Enter a valid email address and agree to receive updates.</p>'); engine.registerFilter('default_pagination',()=> '');
const image = name=>'/assets/'+name;
const products = ['p001-sport-band','survival-club-tee-black','survival-club-tee-white'].map((handle,i)=>({
 id: i+1, handle, url:'/products/'+handle, title:['P001 Sport Band','Survival Club Tee — Black','Survival Club Tee — White'][i],
 description:'<p>Local test fixture. Prices and sizes below are test data only.</p>',price:3500,price_varies:false,available:true,
 images: i===0?[image('product-woven-1100.webp')]:['front','back','detail'].map(view=>image(`club-${i===1?'black':'white'}-${view}-cutout-${view==='detail'?'480':'800'}.webp`)),
 metafields:{custom:{commerce_ready:{value:true},imagery_approved:{value:false},materials_care:{value:'Fixture care guidance'},shipping_returns:{value:'Fixture shipping guidance'}}},
 variants: ['S','M','L'].map((size,j)=>({id:(i+1)*100+j+1,title:size,option1:size,options:[size],available:j!==1,price:3500})),
}));
products[0].options=['Fit','Size'];
products[0].variants=[['Men’s','S/M'],['Men’s','L/XL'],['Women’s','XS/S'],['Women’s','M/L'],['Women’s','XL/XXL']].map(([fit,size],index)=>({id:101+index,title:fit+' / '+size,option1:fit,option2:size,options:[fit,size],available:index!==4,price:3500}));
products.forEach(p=>{p.featured_image=p.images[0];});
let cartItems = [];
if(require.main===module && process.env.EF_PREVIEW_CART){
 for(const entry of JSON.parse(process.env.EF_PREVIEW_CART)){
  const product=products.find(p=>p.variants.some(v=>v.id===entry.id));
  const variant=product?.variants.find(v=>v.id===entry.id);
  const quantity=Math.max(1,Math.floor(Number(entry.quantity)||1));
  if(variant)cartItems.push({product,title:product.title,variant,image:product.featured_image,quantity,final_price:variant.price,final_line_price:variant.price*quantity,url:product.url,properties:[],url_to_remove:'/cart?remove='+variant.id});
 }
}
async function render(url, {staticOrigin} = {}) {
 syncSources();
 const detail=products.find(p=>p.url===url.pathname);
 if (detail) detail.selected_variant=detail.variants.find(v=>String(v.id)===url.searchParams.get('variant'));
 const unready=url.searchParams.has('unready'),unconnected=url.searchParams.has('unconnected');
 const previewProducts=products.map(p=>({...p,...(url.searchParams.has('no_product_images')?{images:[],featured_image:null}:{}),metafields:{custom:{...p.metafields.custom,commerce_ready:{value:!unready}}}}));
 const approvedSettings=JSON.parse(fs.readFileSync(path.join(source,'config/settings_data.json'),'utf8')).current || {};
 if (staticOrigin) {
  for (const product of previewProducts) {
   product.description = '';
   product.variants = product.variants.map(variant => ({...variant, available:true, price:0}));
   product.price = 0;
   delete product.metafields.custom.materials_care;
   delete product.metafields.custom.shipping_returns;
  }
 }
 const bandRanges=Object.fromEntries(Object.entries(approvedSettings).filter(([key])=>(/^band_.*_waist$/.test(key) || key === 'band_waist_estimates')));
 const renderedCartItems=url.searchParams.has('cart_fixture')?previewProducts.map(product=>({product,variant:product.variants[0],image:product.featured_image,quantity:1,final_price:product.price,final_line_price:product.price,url:product.url,properties:[],url_to_remove:'/cart?remove='+product.variants[0].id})):cartItems;
 const context={customer:url.searchParams.get('state')==='signed-in'?{id:'local-preview-customer'}:null,settings:{...bandRanges,enable_purchasing:url.searchParams.has('prelaunch')?approvedSettings.enable_purchasing:true,enable_newsletter:!url.searchParams.has('newsletter_off')&&(!url.searchParams.has('prelaunch')||approvedSettings.enable_newsletter),band_product:unconnected?null:previewProducts[0],black_tee_product:unconnected?null:previewProducts[1],white_tee_product:unconnected?null:previewProducts[2],mens_size_guide:'<p>Fixture men’s measurement guide.</p>',womens_size_guide:'<p>Fixture women’s measurement guide.</p>'},
 routes:{root_url:'/',cart_url:'/cart',search_url:'/search',all_products_collection_url:'/collections/shop',account_url:'/account',account_profile_url:'/account/profile',account_logout_url:'/account/logout',account_login_url:'/account/login',storefront_login_url:'/customer_authentication/login?return_to=%2F'},
 shop:{customer_accounts_enabled:!url.searchParams.has('accounts_disabled'),name:'Eleven Forward · Local Test',privacy_policy:null,terms_of_service:null},request:{path:url.pathname,locale:{iso_code:'en'}},
 preview_forms:Object.fromEntries(['home','footer'].map(key=>[key,url.searchParams.get('newsletter_source')===key?{'posted_successfully?':url.searchParams.get('newsletter')==='pending',errors:url.searchParams.get('newsletter')==='error'?{email:'invalid'}:null}:{}])),form:{},page_title:detail?.title || 'Eleven Forward',canonical_url:'http://127.0.0.1:4174'+url.pathname,
 product:detail?{...previewProducts.find(p=>p.id===detail.id),selected_variant:detail.selected_variant}:null,
 collection:{handle:url.pathname==='/collections/frontpage'?'frontpage':'shop',title:'Shop',description:'',products:previewProducts},
 cart:{'empty?':renderedCartItems.length===0,item_count:renderedCartItems.reduce((n,x)=>n+x.quantity,0),items:renderedCartItems,total_price:renderedCartItems.reduce((n,x)=>n+x.final_line_price,0),taxes_included:false},
 section:{id:'local-test',settings:{heading:'Join the\nMovement'}},template:{suffix:url.pathname.includes('survival-club')?'survival-club':''}};
 if (staticOrigin) {
  context.settings.enable_purchasing = false;
  context.settings.enable_newsletter = true;
  context.settings.mens_size_guide = '';
  context.settings.womens_size_guide = '';
  context.shop = {
   customer_accounts_enabled:false,
   name:'Eleven Forward',
   privacy_policy:{url:'/privacy/'},
   terms_of_service:{url:'/terms/'},
  };
  context.canonical_url = new URL(url.pathname === '/' ? '/' : url.pathname + '/', staticOrigin).href;
 }
 if(url.pathname==='/account'){
  const signedIn=url.searchParams.get('state')==='signed-in';
  const status=url.searchParams.get('subscription');
  const statuses={pending:'Check your email to confirm your subscription.',subscribed:'Subscribed to email updates.',unsubscribed:'Unsubscribed. You will not receive marketing emails.'};
  context.content_for_layout=`<section class="shop-shell"><p class="eyebrow">Local account preview</p><h1>${signedIn?'Your account.':'Account.'}</h1><p>This preview does not authenticate customers, store personal data, or send email. Shopify handles sign-in, orders and profile on the hosted store.</p>${signedIn?'<h2>Orders &amp; Profile</h2><p>Sample account view. No real orders or customer details are shown.</p><a href="/account">Preview signed out</a>':'<a class="submit button-secondary" href="/account?state=signed-in">Preview signed in</a>'}${statuses[status]?`<p role="status">${statuses[status]}</p>`:''}<p><a href="/collections/shop">Continue shopping</a></p></section>`;
  return engine.renderFile('theme',context,{globals:context});
 }
 if(url.pathname==='/checkout'){
  context.settings.enable_newsletter=false;
  context.page_title='Checkout preview';
  context.content_for_layout=`<section class="shop-shell"><p class="eyebrow">Local preview · No payment</p><h1>Checkout preview.</h1><p class="checkout-demo-intro">Your selected items are ready for the next step.</p><div class="cart-layout"><div class="checkout-demo-details"><h2>Delivery &amp; payment</h2><p>On the live shop, Shopify securely collects your delivery details, calculates shipping and taxes, and handles payment.</p><p>This local preview does not collect payment details or place orders.</p><a class="submit button-secondary" href="/cart">Return to cart</a></div><aside class="cart-summary"><h2>Order summary</h2>${cartItems.map(item=>`<div class="checkout-demo-item"><strong>${item.product.title}</strong><p>Size ${item.variant.title} · Quantity ${item.quantity}</p><p>$${(item.final_line_price/100).toFixed(2)} USD</p></div>`).join('') || '<p>Your cart is empty.</p>'}<div class="cart-summary-row cart-subtotal"><span>Subtotal</span><strong>$${(context.cart.total_price/100).toFixed(2)} USD</strong></div><p class="cart-tax-note">Test prices only. Shipping and taxes are not calculated locally.</p></aside></div></section>`;
  return engine.renderFile('theme',context,{globals:context});
 }
 let file = url.pathname==='/'?'eleven-home':url.pathname==='/pages/survival-club'?'survival-club':['/collections/shop','/collections/frontpage'].includes(url.pathname)?JSON.parse(fs.readFileSync(path.join(source,'templates',url.searchParams.get('collection_template')==='shop'?'collection.shop.json':'collection.json'),'utf8')).sections.main.type:url.pathname==='/cart'?'main-cart':detail?'main-product':'main-404';
 const body=await engine.renderFile(file,context,{globals:context});
 context.content_for_layout=`<div class="shopify-section" id="shopify-section-local-test">${body}</div>`;
 return engine.renderFile('theme',context,{globals:context});
}
const server=http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://127.0.0.1:4174');
 if(url.pathname==='/contact' && req.method==='POST'){
  // Local simulation only: discard input, never persist email or contact Shopify.
  let body='';for await(const chunk of req){body+=chunk;if(body.length>8192){res.writeHead(413);res.end();return;}}
  const fields=new URLSearchParams(body),target=new URL(fields.get('return_to')||'/', 'http://127.0.0.1:4174');
  if(target.origin!=='http://127.0.0.1:4174'){res.writeHead(400);res.end();return;}
  target.searchParams.set('newsletter','pending');
  res.writeHead(303,{Location:target.pathname+target.search+target.hash});res.end();return;
 }
 if(url.pathname.startsWith('/assets/')){
  const file=path.join(source,'assets',path.basename(url.pathname));
  const type={'.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf'}[path.extname(file)] || 'application/octet-stream';
  res.setHeader('Content-Type',type);fs.createReadStream(file).on('error',()=>{res.statusCode=404;res.end();}).pipe(res);return;
 }
 if(url.pathname==='/cart/add.js'&&req.method==='POST'){
  let body='';for await(const chunk of req)body+=chunk;
  const id=Number(/name="id"\r\n\r\n(\d+)/.exec(body)?.[1]);
  const quantity=Number(/name="quantity"\r\n\r\n(\d+)/.exec(body)?.[1]||1);
  const product=products.find(p=>p.variants.some(v=>v.id===id)),variant=product?.variants.find(v=>v.id===id);
  res.setHeader('Content-Type','application/json');
  if(!variant?.available){res.statusCode=422;res.end(JSON.stringify({description:'Fixture size is sold out.'}));return;}
  cartItems.push({product,title:product.title,variant,image:product.featured_image,quantity,final_price:variant.price,final_line_price:variant.price*quantity,url:product.url,properties:[],url_to_remove:'/cart?remove='+id});
  res.end(JSON.stringify({id,quantity}));return;
 }
 if(url.pathname==='/cart'&&req.method==='POST'){
  let body='';for await(const chunk of req)body+=chunk;
  const fields=new URLSearchParams(body),updates=fields.getAll('updates[]');
  cartItems=cartItems.map((item,index)=>{const quantity=updates[index]===undefined?item.quantity:Math.max(0,Math.floor(Number(updates[index])||0));return {...item,quantity,final_line_price:item.final_price*quantity};}).filter(item=>item.quantity>0);
  res.writeHead(303,{Location:fields.has('checkout')&&cartItems.length?'/checkout':'/cart'});res.end();return;
 }
 if(url.pathname==='/cart'&&url.searchParams.has('remove'))cartItems=cartItems.filter(x=>x.variant.id!==Number(url.searchParams.get('remove')));
 res.setHeader('Content-Type','text/html');res.end(await render(url));
 }catch(error){res.statusCode=500;res.end(error.stack);}
});
if(require.main===module)server.listen(4174,'127.0.0.1',()=>console.log('Local Shopify fixture: http://127.0.0.1:4174 (test products only)'));
module.exports={render,products,server};
