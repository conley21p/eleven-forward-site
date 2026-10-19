import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
class Element {
 constructor(){this.listeners={};this.dataset={};this.hidden=false;this.checked=false;this.focused=false;this.textContent='';}
 addEventListener(name,fn){this.listeners[name]=fn;}
 fire(name,event={}){return this.listeners[name]?.({preventDefault(){},...event});}
 focus(){this.focused=true;}
 setCustomValidity(message){this.validityMessage=message;}
}
function setup(){
 const ids=['p001','shirt-black','shirt-white','hat'];
 const slides=ids.slice(1).map(id=>{const e=new Element();e.dataset.product=id;return e;});
 const choices=ids.map(id=>{const e=new Element();e.value=id;return e;});
 const prev=new Element(),next=new Element(),counter=new Element(),carousel=new Element();
 carousel.querySelectorAll=()=>slides;
 carousel.querySelector=s=>s==='.carousel-prev'?prev:s==='.carousel-next'?next:counter;
 const dialog=new Element(),close=new Element();
 dialog.querySelectorAll=()=>choices;dialog.querySelector=()=>close;
 dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.fire('close');};
 dialog.getBoundingClientRect=()=>({left:100,right:500,top:100,bottom:600});
 const merchLink=new Element(),heroLink=new Element();merchLink.dataset.interest='current';heroLink.dataset.interest='p001';
 const classes=new Set();
 const document={documentElement:{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}},querySelector:s=>s==='.carousel'?carousel:s==='#interest-dialog'?dialog:null,querySelectorAll:s=>s==='[data-interest]'?[merchLink,heroLink]:[],addEventListener(){}};
 vm.runInNewContext(source,{document,window:{matchMedia:()=>({addEventListener(){}})}});
 return {slides,choices,prev,next,counter,carousel,dialog,close,merchLink,heroLink,classes};
}
test('carousel navigation wraps and keeps a single visible product',()=>{
 const s=setup();s.next.fire('click');assert.deepEqual(s.slides.map(e=>e.hidden),[true,false,true]);assert.equal(s.counter.textContent,'2 / 3');s.next.fire('click');s.next.fire('click');assert.deepEqual(s.slides.map(e=>e.hidden),[false,true,true]);s.prev.fire('click');assert.equal(s.counter.textContent,'3 / 3');
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
 const s=setup();s.carousel.fire('keydown',{key:'ArrowRight'});assert.equal(s.counter.textContent,'2 / 3');s.carousel.fire('touchstart',{changedTouches:[{clientX:200,clientY:100}]});s.carousel.fire('touchend',{changedTouches:[{clientX:120,clientY:105}]});assert.equal(s.counter.textContent,'3 / 3');s.carousel.fire('touchstart',{changedTouches:[{clientX:200,clientY:100}]});s.carousel.fire('touchend',{changedTouches:[{clientX:190,clientY:300}]});assert.equal(s.counter.textContent,'3 / 3');
});
