import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
function setup(product=false) {
 let scroll=0,queued=0,callback;
 const events={},classes=new Set(),motion={matches:false,addEventListener(type,fn){this.change=fn}};
 const style=()=>({setProperty(k,v){this[k]=v}});
 const node=()=>({style:style(),dataset:{},attributes:{},setAttribute(k,v){this.attributes[k]=v},removeAttribute(k){delete this.attributes[k]}});
 const moments=Array.from({length:3},()=>{const e=node(),copy=node();e.querySelector=()=>copy;return e});
 const resolvers=[];
 const images=Array.from({length:4},(_,i)=>({...node(),loading:'lazy',complete:true,naturalWidth:900,decode:()=>new Promise(resolve=>resolvers[i]=resolve)}));
 const pictures=images.map(image=>({...node(),querySelector:()=>image}));
 const hero={...node(),classList:{toggle(c,on){on?classes.add(c):classes.delete(c)}},getBoundingClientRect:()=>({top:83-scroll,height:3317}),querySelectorAll:()=>moments,querySelector:s=>s==='.product-sticky'?{getBoundingClientRect:()=>({height:917})}:pictures[['overview','mesh','top','bottom'].indexOf(s.match(/image="(.*?)"/)[1])]};
 const document={hidden:false,documentElement:{classList:{add(){}}},querySelector:s=>s==='[data-product-story]'&&product?hero:null,querySelectorAll:()=>[],addEventListener(type,fn){events[type]=fn}};
 const window={innerHeight:1000,matchMedia:q=>q.includes('reduced')?motion:{matches:false,addEventListener(){}},addEventListener(type,fn){events[type]=fn},requestAnimationFrame(fn){callback=fn;return ++queued},cancelAnimationFrame(){callback=null}};
 const context={document,window};vm.runInNewContext(source,context);
 const flush=()=>{const fn=callback;callback=null;fn?.()};
 return {context,events,window,document,classes,moments,pictures,images,motion,flush,queued:()=>queued,scrollTo(v){scroll=v;events.scroll();flush()},async decode(i){resolvers[i]();await Promise.resolve();flush()}};
}
test('product weights synchronize the three messages and top/bottom views in both directions',()=>{
 const {productStoryFrame:frame}=setup().context;
 assert.equal(frame(0).weights[0],1);assert.equal(frame(1.1).weights[0]+frame(1.1).weights[1],1);
 assert.ok(frame(1.1).weights[1]>.49);assert.equal(frame(1.5).weights[1],1);
 assert.equal(frame(2.3).weights[2],1);assert.equal(frame(2.3).bottom,0);
 assert.ok(frame(2.6).bottom>.49 && frame(2.6).bottom<.51);assert.equal(frame(3).bottom,1);
 assert.equal(frame(1.5).weights[1],1);assert.equal(frame(.5).weights[0],1);
});
test('slow detail decoding holds the last ready image and resumes without another scroll',async()=>{
 const s=setup(true);s.flush();await s.decode(0);
 s.scrollTo(600);assert.ok(s.images[1].dataset.decoding);assert.equal(s.moments[0].style.opacity,'1');
 s.scrollTo(1200);assert.equal(s.moments[0].style.opacity,'1');assert.equal(s.moments[1].style.opacity,'0');
 await s.decode(1);assert.equal(s.moments[1].style.opacity,'1');
 s.scrollTo(2000);assert.equal(s.moments[1].style.opacity,'1');await s.decode(2);assert.equal(s.moments[2].style.opacity,'1');
 s.scrollTo(2300);assert.equal(s.pictures[3].style.opacity,'0');await s.decode(3);assert.equal(s.pictures[3].style.opacity,'1');
 s.scrollTo(300);assert.equal(s.moments[0].style.opacity,'1');
});
test('short-screen and reduced-motion fallback remove pinned presentation and expose every message',async()=>{
 const s=setup(true);s.flush();await s.decode(0);assert.ok(s.classes.has('product-story-ready'));
 s.window.innerHeight=500;s.events.resize();s.flush();assert.equal(s.classes.has('product-story-ready'),false);
 for(const moment of s.moments){assert.equal(moment.style.opacity,'');assert.equal(moment.attributes['aria-hidden'],undefined)}
 s.window.innerHeight=1000;s.events.resize();s.flush();assert.ok(s.classes.has('product-story-ready'));
 s.motion.matches=true;s.motion.change();s.flush();assert.equal(s.classes.has('product-story-ready'),false);
 for(const picture of s.pictures)assert.equal(picture.style.opacity,'');
});
test('mission completes by mid-screen and founder light fades on exit without changing the image',()=>{
 const s=setup(),mission=s.context.missionSceneFrame,founder=s.context.founderSceneFrame;
 assert.equal(mission(1000,1000).lines[0],0);for(const value of mission(500,1000).lines)assert.equal(value,1);assert.equal(mission(500,1000).finish,1);
 assert.equal(founder(1000,1700,1100,1000).enter,0);assert.equal(founder(0,700,500,1000).glow,1);assert.equal(founder(-700,0,-200,1000).glow,0);
});
test('several visible scenes share one queued frame and stop when the tab is hidden',()=>{
 const s=setup();let first=0,second=0;
 const a=s.context.registerScrollScene({},()=>first++),b=s.context.registerScrollScene({},()=>second++);
 a.enable(true);b.enable(true);assert.equal(s.queued(),1);s.flush();assert.equal(first,1);assert.equal(second,1);
 s.events.scroll();s.events.resize();assert.equal(s.queued(),2);s.flush();
 s.document.hidden=true;s.events.scroll();assert.equal(s.queued(),2);
});
