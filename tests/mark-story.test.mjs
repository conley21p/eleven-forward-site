import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
function setup({reduced=false,mobile=false}={}) {
 let scroll=0, callback, observer, queued=0;
 const windowEvents={}, documentEvents={}, classes=new Set();
 const node=()=>({dataset:{},style:{setProperty(k,v){this[k]=v}},attributes:{},setAttribute(k,v){this.attributes[k]=v}});
 const panels=[node(),node(),node(),node()];
 panels.forEach((p,i)=>p.getBoundingClientRect=()=>({top:550+i*700-scroll,height:700}));
 const nodes=Object.fromEntries(['[data-mark-reveal]','[data-mark-small]','[data-mark-tall]','[data-mark-guides]','[data-mark-date]','[data-mark-angle]','[data-mark-direction]','[data-mark-arrow]','[data-mark-arrowhead]'].map(k=>[k,node()]));
 nodes['.mark-stage']={getBoundingClientRect:()=>({bottom:mobile?302:452})};
 const story={closest:()=>({getBoundingClientRect:()=>({top:450-scroll})}),querySelectorAll:()=>panels,querySelector:s=>nodes[s],classList:{toggle(c,on){on?classes.add(c):classes.delete(c)}}};
 const motion={matches:reduced,addEventListener(type,fn){this.change=fn}};
 const document={hidden:false,documentElement:{classList:{add(){}}},querySelector:s=>s==='[data-mark-story]'?story:s==='.header'?{getBoundingClientRect:()=>({bottom:80})}:null,querySelectorAll:()=>[],addEventListener:(type,fn)=>documentEvents[type]=fn};
 const window={innerHeight:1000,matchMedia:q=>q.includes('reduced')?motion:{matches:mobile,addEventListener(){}},addEventListener:(type,fn)=>windowEvents[type]=fn,requestAnimationFrame(fn){queued++;callback=fn;return queued},cancelAnimationFrame(){callback=null},IntersectionObserver:class{constructor(fn){observer=fn}observe(){}},ResizeObserver:class{observe(){}}};
 const context={document,window};vm.runInNewContext(source,context);
 const flush=()=>{const task=callback;callback=null;task?.()};
 return {nodes,panels,classes,motion,document,windowEvents,documentEvents,frame:context.markStoryFrame,intro:context.markIntroFrame,flush,queued:()=>queued,scrollTo(v){scroll=v;windowEvents.scroll();flush()},visible(v){observer([{isIntersecting:v}])},setReduced(v){motion.matches=v;motion.change();flush()}};
}
test('logo reveals, diagrams its lean, then steps to the exact resting mark',()=>{
 const s=setup();assert.equal(s.frame(0).reveal,0);assert.equal(s.frame(.7).reveal,1);
 assert.equal(s.frame(.5).date,1);assert.equal(s.frame(1.5).guides,1);assert.equal(s.frame(1.5).angle,1);
 assert.ok(s.frame(3.25).smallY < -13);assert.equal(s.frame(3.25).tallY,0);
 assert.ok(s.frame(3.7).tallY < -13);
 assert.equal(s.frame(4).reveal,1);assert.equal(s.frame(4).guides,0);
 assert.ok(Math.abs(s.frame(4).smallY)<1e-10);assert.ok(Math.abs(s.frame(4).tallY)<1e-10);
});
test('scroll scrubs backward and handles entry into the middle of the story',()=>{
 const s=setup();s.scrollTo(1050);assert.equal(s.nodes['[data-mark-guides]'].style.opacity,'1');assert.equal(s.panels[1].dataset.active,'true');
 s.scrollTo(1750);assert.equal(s.panels[2].dataset.active,'true');assert.equal(s.nodes['[data-mark-guides]'].style.opacity,'1');assert.equal(s.nodes['[data-mark-direction]'].style.opacity,'1');
 s.scrollTo(2450);assert.equal(s.panels[3].dataset.active,'true');assert.equal(s.nodes['[data-mark-guides]'].style.opacity,'0');
 s.scrollTo(1050);assert.equal(s.nodes['[data-mark-guides]'].style.opacity,'1');
 s.scrollTo(-300);assert.equal(s.nodes['[data-mark-reveal]'].attributes.y,'95');
});
test('updates batch into one frame and stop outside the viewport or hidden tab',()=>{
 const s=setup();s.flush();let before=s.queued();s.windowEvents.scroll();s.windowEvents.scroll();s.windowEvents.resize();assert.equal(s.queued(),before+1);s.flush();
 s.visible(false);before=s.queued();s.windowEvents.scroll();assert.equal(s.queued(),before);
 s.visible(true);s.flush();s.document.hidden=true;before=s.queued();s.windowEvents.scroll();assert.equal(s.queued(),before);
 s.document.hidden=false;s.documentEvents.visibilitychange();assert.equal(s.queued(),before+1);
});
test('reduced motion is static and can be toggled while the page is open',()=>{
 const s=setup({reduced:true});assert.equal(s.classes.has('mark-story-ready'),false);assert.equal(s.queued(),0);assert.equal(s.nodes['[data-mark-reveal]'].attributes.y,'-20');assert.equal(s.nodes['[data-mark-guides]'].style.opacity,'0');
 s.setReduced(false);assert.equal(s.classes.has('mark-story-ready'),true);
 s.setReduced(true);assert.equal(s.classes.has('mark-story-ready'),false);assert.equal(s.nodes['[data-mark-reveal]'].attributes.y,'-20');
});
test('mobile stage leaves the active text below the sticky image',()=>{
 const s=setup({mobile:true});s.scrollTo(900);assert.equal(s.panels[1].dataset.active,'true');
});

test('logo arrives before copy slides in after the section fills the viewport',()=>{
 const s=setup();
 const arriving=s.intro(200,1000,80);assert.ok(arriving.reveal>0);assert.equal(arriving.copy,0);
 const filled=s.intro(80,1000,80);assert.equal(filled.reveal,1);assert.equal(filled.copy,0);
 assert.equal(s.intro(20,1000,80).copy,.5);assert.equal(s.intro(-40,1000,80).copy,1);
 s.scrollTo(300);assert.equal(s.panels[0].style['--mark-copy-entry'],'0');
 s.scrollTo(490);assert.equal(s.panels[0].style['--mark-copy-entry'],'1');
 s.scrollTo(300);assert.equal(s.panels[0].style['--mark-copy-entry'],'0');
 s.setReduced(true);assert.equal(s.panels[0].style['--mark-copy-entry'],'1');
});

test('angle annotations persist while the journey arrow draws and fade for the final step',()=>{
 const s=setup();
 assert.equal(s.frame(1.5).direction,0);
 assert.equal(s.frame(2.2).guides,1);assert.ok(s.frame(2.2).arrow>0 && s.frame(2.2).arrow<1);
 assert.equal(s.frame(2.5).guides,1);assert.equal(s.frame(2.5).arrow,1);assert.equal(s.frame(2.5).arrowhead,1);
 assert.equal(s.frame(2.5).smallY,0);assert.equal(s.frame(2.5).tallY,0);
 assert.equal(s.frame(3.5).guides,0);assert.equal(s.frame(3.5).direction,0);
 s.scrollTo(1750);assert.equal(s.nodes['[data-mark-arrow]'].style.strokeDashoffset,'0');
 s.setReduced(true);assert.equal(s.nodes['[data-mark-direction]'].style.opacity,'0');
});
