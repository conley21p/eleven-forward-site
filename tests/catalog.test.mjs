import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
function setup(zoomBack=false,shirtId='shirt-black'){
 let scroll=0,callback;const events={},classes=new Set();
 const node=()=>({style:{setProperty(k,v){this[k]=v}},attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]}});
 const resolvers=[];
 const images=Array.from({length:zoomBack?3:4},(_,i)=>({...node(),complete:true,naturalWidth:1254,naturalHeight:1254,decode:()=>new Promise(resolve=>{resolvers[i]=resolve})}));
 const views=images.map(image=>{const caption={textContent:'Back'};return {...node(),getBoundingClientRect:()=>({width:800,height:800}),querySelector:s=>s==='figcaption'?caption:image}});const steps=Array.from({length:4},node);
 const story={...node(),id:zoomBack?shirtId:'hat',classList:{toggle(k,on){on?classes.add(k):classes.delete(k)}},getBoundingClientRect:()=>({top:82-scroll,bottom:3400-scroll,height:3318}),querySelector:()=>({getBoundingClientRect:()=>({height:918})}),querySelectorAll:s=>s==='[data-catalog-view]'?views:steps};
 const motion={matches:false,addEventListener(t,fn){this.change=fn}};
 const document={hidden:false,documentElement:{classList:{add(){}}},querySelector:()=>null,querySelectorAll:s=>s==='[data-catalog-story]'?[story]:[],addEventListener(t,fn){events[t]=fn}};
 const window={innerHeight:1000,matchMedia:()=>motion,addEventListener(t,fn){events[t]=fn},requestAnimationFrame(fn){callback=fn;return 1},cancelAnimationFrame(){callback=null}};
 const context={document,window};vm.runInNewContext(source,context);
 const flush=()=>{const fn=callback;callback=null;fn?.()};
 return {context,views,steps,images,classes,motion,window,document,flush,scroll(v){scroll=v;events.scroll();flush()},resize(h){window.innerHeight=h;events.resize();flush()},async decode(i){resolvers[i]?.();await Promise.resolve();flush()}};
}
test('four views map transitions, hold, and reverse deterministically',()=>{
 const s=setup(),frame=s.context.catalogStoryFrame;
 assert.equal(frame(0).active,0);assert.equal(frame(1.1).weights.length,4);assert.ok(Math.abs(frame(1.1).weights[0]-.5)<.001);
 for(const p of [0,.9,1.1,1.8,2.1,2.8,3.1,4,2.4,.1])assert.ok(Math.abs(frame(p).weights.reduce((a,b)=>a+b,0)-1)<1e-9);
 assert.equal(frame(4).active,3);assert.equal(frame(2.4).active,2);assert.equal(frame(.1).active,0);
});
test('slow decoding holds a visible frame and resumes when the next view is ready',async()=>{
 const s=setup();s.flush();await s.decode(0);s.scroll(750);assert.equal(s.views[0].style.opacity,'1');
 await s.decode(1);assert.equal(s.views[1].style.opacity,'1');assert.equal(s.steps[1].attrs['aria-current'],'step');
 s.scroll(1950);assert.equal(s.views[1].style.opacity,'1');await s.decode(2);await s.decode(3);assert.equal(s.views[3].style.opacity,'1');
 s.scroll(100);assert.equal(s.views[0].style.opacity,'1');
});
test('short screens and reduced motion expose the full gallery without sticky styling',async()=>{
 const s=setup();s.flush();await s.decode(0);assert.ok(s.classes.has('catalog-ready'));
 s.resize(500);assert.equal(s.classes.has('catalog-ready'),false);for(const view of s.views){assert.equal(view.style.opacity,'');assert.equal(view.attrs['aria-hidden'],undefined)}
 s.resize(1000);s.motion.matches=true;s.motion.change();s.flush();assert.equal(s.classes.has('catalog-ready'),false);
});
test('rapid entry midway prepares intermediate images without blank frames',async()=>{
 const s=setup();s.flush();await s.decode(0);s.scroll(1500);assert.ok(s.images.slice(1,3).every(image=>image.loading==='eager'));assert.equal(s.views[0].style.opacity,'1');await s.decode(2);assert.equal(s.views[2].style.opacity,'1');
});

test('tees zoom the front, pull back, slide, then zoom the same back and reverse',async()=>{
 const s=setup(true);s.flush();await s.decode(0);
 s.scroll(900);assert.ok(s.images[0].style.transform.includes('scale(3)'));assert.equal(s.steps[1].attrs['aria-current'],'step');
 s.scroll(1275);await s.decode(1);assert.ok(s.images[0].style.transform.includes('scale(2)'));assert.equal(s.views[1].style.opacity,'0');
 s.scroll(1425);assert.ok(s.images[0].style.transform.includes('scale(1)'));
 assert.equal(s.views[0].style.opacity,'1');assert.equal(s.views[1].style.opacity,'1');
 assert.ok(Math.abs(parseFloat(s.views[0].style.transform.slice(11))-50)<.01);
 assert.ok(Math.abs(parseFloat(s.views[1].style.transform.slice(11))+50)<.01);
 s.scroll(1600);assert.equal(s.views[1].style.transform,'translateX(0%)');assert.equal(s.views[0].style.opacity,'0');
 s.scroll(2300);assert.ok(s.images[1].style.transform.includes('scale(2.2)'));assert.equal(s.views[2].style.opacity,'0');assert.equal(s.steps[3].attrs['aria-current'],'step');
 assert.equal(s.views[1].querySelector('figcaption').textContent,'Graphic detail');
 s.scroll(900);assert.ok(s.images[0].style.transform.includes('scale(3)'));assert.equal(s.views[0].attrs['aria-hidden'],'false');
 s.scroll(0);assert.ok(s.images[0].style.transform.includes('scale(1)'));
 s.resize(500);for(const image of s.images.slice(0,2))assert.equal(image.style.transform,'');
 assert.equal(s.views[2].attrs['aria-hidden'],undefined);
});
test('tee holds the front close-up until the back decodes before pulling out',async()=>{
 const s=setup(true);s.flush();await s.decode(0);s.scroll(1000);
 const held=s.images[0].style.transform;s.scroll(1275);assert.equal(s.images[0].style.transform,held);
 await s.decode(1);assert.ok(s.images[0].style.transform.includes('scale(2)'));
 const frame=s.context.catalogStoryFrame;
 for(const p of [0,1,1.35,2,2.125,2.25,2.375,2.5,3,3.8,4,1.4]){
  const f=frame(p,true);assert.ok(f.frontZoom>=0 && f.frontZoom<=1);assert.ok(f.weights.some(w=>w>0));
 }
});

test('all cap view transitions exit right and enter left without fading',async()=>{
 const s=setup();s.flush();await s.decode(0);
 for(let i=1;i<4;i++){
  s.scroll(i*600+60);await s.decode(i);
  assert.equal(s.views[i-1].style.opacity,'1');assert.equal(s.views[i].style.opacity,'1');
  assert.ok(Math.abs(parseFloat(s.views[i-1].style.transform.slice(11))-50)<.01);
  assert.ok(Math.abs(parseFloat(s.views[i].style.transform.slice(11))+50)<.01);
 }
 s.scroll(0);assert.equal(s.views[0].style.transform,'translateX(0%)');assert.equal(s.views[0].style.opacity,'1');
});

test('each tee centers its own chest lettering and reduced motion clears both zooms',async()=>{
 for(const id of ['shirt-black','shirt-white']){
  const s=setup(true,id);s.flush();await s.decode(0);s.scroll(900);
  const [x,y]=s.images[0].style.transformOrigin.split(' ').map(parseFloat);
  assert.ok(Math.abs(x-(id==='shirt-black'?500.8:512))<.01);
  assert.ok(Math.abs(y-(id==='shirt-black'?220:233.6))<.01);
  assert.equal(s.views[0].querySelector('figcaption').textContent,'Front logo');
  s.motion.matches=true;s.motion.change();s.flush();
  assert.equal(s.images[0].style.transform,'');assert.equal(s.images[1].style.transform,'');
  assert.equal(s.views[0].querySelector('figcaption').textContent,'Front');
 }
});

test('mobile snap destinations hold completed front, chest logo, back and detail frames',()=>{
 const {context}=setup(true),frame=context.catalogStoryFrame;
 const destinations=[0,.4,.665,.9625].map(position=>frame(position*4,true));
 destinations.forEach((state,i)=>assert.equal(state.active,i));
 assert.equal(destinations[0].frontZoom,0);
 assert.equal(destinations[1].frontZoom,1);
 assert.equal(destinations[2].slide,1);assert.equal(destinations[2].zoom,0);
 assert.equal(destinations[3].zoom,1);
});
