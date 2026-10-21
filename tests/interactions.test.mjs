import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
class Element {
 constructor(){this.attributes={};this.listeners={};this.dataset={};this.checked=false;this.focused=false;}
 addEventListener(name,fn){this.listeners[name]=fn;}
 fire(name,event={}){return this.listeners[name]?.({preventDefault(){},...event});}
 focus(){this.focused=true;}
 setAttribute(name,value){this.attributes[name]=value;}
 setCustomValidity(message){this.validityMessage=message;}
}
function setup(hash=''){
 const ids=['p001','shirt-black','shirt-white','hat'];
 const choices=ids.map(id=>Object.assign(new Element(),{value:id}));
 const links=ids.map(id=>{const node=new Element();node.dataset.interest=id;return node;});
 const dialog=new Element(),close=new Element();
 dialog.querySelectorAll=()=>choices;dialog.querySelector=()=>close;
 dialog.showModal=()=>{dialog.open=true};dialog.close=()=>{dialog.open=false;dialog.fire('close')};
 dialog.getBoundingClientRect=()=>({left:100,right:500,top:100,bottom:600});
 const classes=new Set();
 const document={documentElement:{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}},querySelector:s=>s==='#interest-dialog'?dialog:null,querySelectorAll:s=>s==='[data-interest]'?links:[],addEventListener(){}};
 vm.runInNewContext(source,{document,window:{location:{hash},matchMedia:()=>({addEventListener(){}})}});
 return {links,choices,dialog,close,classes};
}
test('each product CTA selects its own product and keeps P001 first',()=>{
 const s=setup();assert.equal(s.choices[0].value,'p001');
 for(const link of s.links){link.fire('click');assert.equal(s.dialog.open,true);assert.deepEqual(s.choices.filter(c=>c.checked).map(c=>c.value),[link.dataset.interest]);s.dialog.close();}
});
test('multiple interests remain selectable and reopening selects the clicked product',()=>{
 const s=setup();s.links[1].fire('click');s.choices[0].checked=true;assert.equal(s.choices.filter(c=>c.checked).length,2);
 s.dialog.close();s.links[3].fire('click');assert.deepEqual(s.choices.filter(c=>c.checked).map(c=>c.value),['hat']);
});
test('closing the modal restores focus and clears its scroll lock',()=>{
 const s=setup();s.links[2].fire('click');assert.ok(s.classes.has('modal-open'));s.close.fire('click');assert.equal(s.dialog.open,false);assert.ok(s.links[2].focused);assert.equal(s.classes.has('modal-open'),false);
});
test('landing on signup or product anchors never opens the modal',()=>{
 for(const hash of ['#updates','#shirt-black','#shirt-white','#hat']){const s=setup(hash);assert.ok(!s.dialog.open);s.links[0].fire('click');assert.equal(s.dialog.open,true);}
});
