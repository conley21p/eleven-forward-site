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
 const moments=Array.from({length:2},()=>{const e=node(),copy=node();e.querySelector=()=>copy;return e});
 const steps=Array.from({length:2},node);
 const resolvers=[];
 const images=Array.from({length:2},(_,i)=>({...node(),loading:'lazy',complete:true,naturalWidth:900,decode:()=>new Promise(resolve=>resolvers[i]=resolve)}));
 const pictures=images.map(image=>({...node(),querySelector:()=>image}));
 const hero={...node(),classList:{toggle(c,on){on?classes.add(c):classes.delete(c)}},getBoundingClientRect:()=>({top:83-scroll,height:2517}),querySelectorAll:s=>s==='[data-product-step]'?steps:moments,querySelector:s=>s==='.product-sticky'?{getBoundingClientRect:()=>({height:917})}:pictures[['overview','mesh'].indexOf(s.match(/image="(.*?)"/)[1])]};
 const document={hidden:false,documentElement:{classList:{add(){}}},querySelector:s=>s==='[data-product-story]'&&product?hero:null,querySelectorAll:()=>[],addEventListener(type,fn){events[type]=fn}};
 const window={innerHeight:1000,matchMedia:q=>q.includes('reduced')?motion:{matches:false,addEventListener(){}},addEventListener(type,fn){events[type]=fn},requestAnimationFrame(fn){callback=fn;return ++queued},cancelAnimationFrame(){callback=null}};
 const context={document,window};vm.runInNewContext(source,context);
 const flush=()=>{const fn=callback;callback=null;fn?.()};
 return {context,events,window,document,classes,moments,pictures,images,steps,motion,flush,queued:()=>queued,scrollTo(v){scroll=v;events.scroll();flush()},async decode(i){resolvers[i]();await Promise.resolve();flush()}};
}
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
