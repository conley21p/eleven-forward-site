import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
class Element {
 constructor(){this.attributes={};this.listeners={};this.dataset={};this.hidden=false;this.checked=false;this.focused=false;this.textContent='';}
 addEventListener(name,fn){this.listeners[name]=fn;}
 fire(name,event={}){return this.listeners[name]?.({preventDefault(){},...event});}
 click(){this.fire('click');}
 focus(){this.focused=true;}
 setAttribute(name,value){this.attributes[name]=value;}
 contains(value){return value===this;}
 setCustomValidity(message){this.validityMessage=message;}
}
function setup({reduced=false,hash=''}={}){
 const ids=['p001','shirt-black','shirt-white','hat'];
 const slides=ids.slice(1).map(id=>{const e=new Element();e.dataset.product=id;e.dataset.label=id==='shirt-black'?'Survival Club Tee (Black)':id==='shirt-white'?'Survival Club Tee (White)':'Bad Day to Be a Colon Cap';return e;});
 const choices=ids.map(id=>{const e=new Element();e.value=id;return e;});
 const prev=new Element(),next=new Element(),counter=new Element(),carousel=new Element(),toggle=new Element(),productLabel=new Element();
 const dots=[new Element(),new Element(),new Element()];
 carousel.querySelectorAll=s=>s==='.carousel-dot'?dots:slides;
 carousel.querySelector=s=>s==='.carousel-prev'?prev:s==='.carousel-next'?next:s==='.carousel-toggle'?toggle:s==='.carousel-current'?productLabel:counter;
 const dialog=new Element(),close=new Element();
 dialog.querySelectorAll=()=>choices;dialog.querySelector=()=>close;
 dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.fire('close');};
 dialog.getBoundingClientRect=()=>({left:100,right:500,top:100,bottom:600});
 const merchLink=new Element(),heroLink=new Element();merchLink.dataset.interest='current';heroLink.dataset.interest='p001';
 const classes=new Set();
 const documentEvents={};
 const document={hidden:false,documentElement:{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}},querySelector:s=>s==='.carousel'?carousel:s==='#interest-dialog'?dialog:s==='[data-interest="p001"]'?heroLink:null,querySelectorAll:s=>s==='[data-interest]'?[merchLink,heroLink]:[],addEventListener:(name,fn)=>documentEvents[name]=fn};
 let timer;
 const motion={matches:reduced,addEventListener(){}};
 vm.runInNewContext(source,{document,window:{location:{hash},matchMedia:q=>q.includes('reduced')?motion:{addEventListener(){}}},setTimeout:(fn,ms)=>{timer={fn,ms};return 1},clearTimeout:()=>{timer=null}});
 return {slides,choices,prev,next,counter,carousel,dialog,close,merchLink,heroLink,classes,dots,toggle,productLabel,document,documentEvents,timer:()=>timer,tick:()=>{const task=timer;timer=null;task?.fn()}};
}
test('carousel navigation wraps and keeps a single visible product',()=>{
 const s=setup();s.next.fire('click');assert.deepEqual(s.slides.map(e=>e.hidden),[true,false,true]);assert.equal(s.counter.textContent,'02 / 03');s.next.fire('click');s.next.fire('click');assert.deepEqual(s.slides.map(e=>e.hidden),[false,true,true]);s.prev.fire('click');assert.equal(s.counter.textContent,'03 / 03');
});
test('current carousel product is selected and P001 is the first option',()=>{
 const s=setup();s.next.fire('click');s.merchLink.fire('click');assert.equal(s.choices[0].value,'p001');assert.equal(s.dialog.open,true);assert.deepEqual(s.choices.filter(e=>e.checked).map(e=>e.value),['shirt-white']);assert.ok(s.classes.has('modal-open'));
});
test('multiple interests can be selected; reopening defaults to the displayed product',()=>{
 const s=setup();s.merchLink.fire('click');s.choices[0].checked=true;assert.equal(s.choices.filter(e=>e.checked).length,2);s.dialog.close();s.next.fire('click');s.next.fire('click');s.merchLink.fire('click');assert.deepEqual(s.choices.filter(e=>e.checked).map(e=>e.value),['hat']);
});
test('hero defaults to P001 and closing restores opener focus',()=>{
 const s=setup();s.heroLink.fire('click');assert.deepEqual(s.choices.filter(e=>e.checked).map(e=>e.value),['p001']);s.close.fire('click');assert.equal(s.dialog.open,false);assert.equal(s.heroLink.focused,true);assert.equal(s.classes.has('modal-open'),false);
});
test('keyboard and swipe advance products; vertical swipe does not',()=>{
 const s=setup();s.carousel.fire('keydown',{key:'ArrowRight'});assert.equal(s.counter.textContent,'02 / 03');s.carousel.fire('touchstart',{changedTouches:[{clientX:200,clientY:100}]});s.carousel.fire('touchend',{changedTouches:[{clientX:120,clientY:105}]});assert.equal(s.counter.textContent,'03 / 03');s.carousel.fire('touchstart',{changedTouches:[{clientX:200,clientY:100}]});s.carousel.fire('touchend',{changedTouches:[{clientX:190,clientY:300}]});assert.equal(s.counter.textContent,'03 / 03');
});

test('autoplay advances every six seconds and can be paused',()=>{const s=setup();assert.equal(s.timer().ms,6000);s.tick();assert.equal(s.counter.textContent,'02 / 03');s.toggle.fire('click');assert.equal(s.timer(),null);assert.equal(s.toggle.textContent,'Play');s.toggle.fire('click');assert.equal(s.timer().ms,6000)});
test('autoplay pauses for hover, focus, hidden tabs and an open dialog',()=>{const s=setup();s.carousel.fire('mouseenter');assert.equal(s.timer(),null);s.carousel.fire('mouseleave');assert.ok(s.timer());s.carousel.fire('focusin');assert.equal(s.timer(),null);s.carousel.fire('focusout',{relatedTarget:null});assert.ok(s.timer());s.document.hidden=true;s.documentEvents.visibilitychange();assert.equal(s.timer(),null);s.document.hidden=false;s.documentEvents.visibilitychange();s.merchLink.fire('click');assert.equal(s.timer(),null);s.dialog.close();assert.ok(s.timer())});
test('reduced motion starts paused; dots select a slide and update modal default',()=>{const s=setup({reduced:true});assert.equal(s.timer(),null);s.dots[2].fire('click');assert.equal(s.counter.textContent,'03 / 03');s.merchLink.fire('click');assert.deepEqual(s.choices.filter(e=>e.checked).map(e=>e.value),['hat']);assert.equal(s.dots[2].attributes['aria-pressed'],'true')});

test('landing on #updates never opens the modal automatically; clicking signup still works',()=>{const s=setup({hash:'#updates'});assert.ok(!s.dialog.open);s.heroLink.fire('click');assert.equal(s.dialog.open,true)});

test('paging-row label follows the current slide for manual and automatic changes',()=>{const s=setup();assert.equal(s.productLabel.textContent,'Survival Club Tee (Black)');s.next.fire('click');assert.equal(s.productLabel.textContent,'Survival Club Tee (White)');s.tick();assert.equal(s.productLabel.textContent,'Bad Day to Be a Colon Cap')});
