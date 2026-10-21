import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
function setup(zoomBack=false){
 let scroll=0,callback;const events={},classes=new Set();
 const node=()=>({style:{setProperty(k,v){this[k]=v}},attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]}});
 const resolvers=[];
 const images=Array.from({length:zoomBack?3:4},(_,i)=>({...node(),complete:true,naturalWidth:1254,naturalHeight:1254,decode:()=>new Promise(resolve=>{resolvers[i]=resolve})}));
 const views=images.map(image=>{const caption={textContent:'Back'};return {...node(),getBoundingClientRect:()=>({width:800,height:800}),querySelector:s=>s==='figcaption'?caption:image}});const steps=Array.from({length:zoomBack?3:4},node);
 const story={...node(),id:zoomBack?'shirt-black':'hat',classList:{toggle(k,on){on?classes.add(k):classes.delete(k)}},getBoundingClientRect:()=>({top:82-scroll,bottom:3400-scroll,height:3318}),querySelector:()=>({getBoundingClientRect:()=>({height:918})}),querySelectorAll:s=>s==='[data-catalog-view]'?views:steps};
 const motion={matches:false,addEventListener(t,fn){this.change=fn}};
 const document={hidden:false,documentElement:{classList:{add(){}}},querySelector:()=>null,querySelectorAll:s=>s==='[data-catalog-story]'?[story]:[],addEventListener(t,fn){events[t]=fn}};
 const window={innerHeight:1000,matchMedia:()=>motion,addEventListener(t,fn){events[t]=fn},requestAnimationFrame(fn){callback=fn;return 1},cancelAnimationFrame(){callback=null}};
 const context={document,window};vm.runInNewContext(source,context);
 const flush=()=>{const fn=callback;callback=null;fn?.()};
 return {context,views,steps,images,classes,motion,window,document,flush,scroll(v){scroll=v;events.scroll();flush()},resize(h){window.innerHeight=h;events.resize();flush()},async decode(i){resolvers[i]?.();await Promise.resolve();flush()}};
}
test('four views crossfade only at transitions, hold, and reverse deterministically',()=>{
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

test('tee story goes front to back, then zooms that same back image and reverses',async()=>{
 const s=setup(true);s.flush();await s.decode(0);s.scroll(1100);await s.decode(1);
 assert.equal(s.views[1].style.opacity,'1');assert.equal(s.images[1].style.transform.includes('scale(1)'),true);
 s.scroll(2300);assert.equal(s.views[1].style.opacity,'1');assert.equal(s.views[2].style.opacity,'0');assert.ok(s.images[1].style.transform.includes('scale(2.2)'));assert.equal(s.steps[2].attrs['aria-current'],'step');
 assert.equal(s.views[1].querySelector('figcaption').textContent,'Graphic detail');assert.equal(s.views[1].attrs['aria-hidden'],'false');
 s.scroll(1100);assert.equal(s.images[1].style.transform.includes('scale(1)'),true);assert.equal(s.views[1].querySelector('figcaption').textContent,'Back');
 s.resize(500);assert.equal(s.images[1].style.transform,'');assert.equal(s.views[2].attrs['aria-hidden'],undefined);
});

test('both tee front/back views slide horizontally with full opacity and reverse',async()=>{
 const s=setup(true);s.flush();await s.decode(0);s.scroll(880);await s.decode(1);
 assert.equal(s.views[0].style.opacity,'1');assert.equal(s.views[1].style.opacity,'1');
 assert.ok(Math.abs(parseFloat(s.views[0].style.transform.slice(11))-50)<.01);assert.ok(Math.abs(parseFloat(s.views[1].style.transform.slice(11))+50)<.01);
 s.scroll(1100);assert.equal(s.views[1].style.transform,'translateX(0%)');assert.equal(s.views[0].style.opacity,'0');
 s.scroll(0);assert.equal(s.views[0].style.transform,'translateX(0%)');assert.equal(s.views[0].style.opacity,'1');
});
