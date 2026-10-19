import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../src/app.js', import.meta.url),'utf8');
function setup({enabled=true, valid=true,productChoices=[],fetchImpl=async()=>({ok:true,json:async()=>({success:true})})}={}){
 const handlers={}; const status={dataset:{},textContent:''}; const button={disabled:false,textContent:'Get updates'}; const fieldset={disabled:false};
 const attributes={}; const form={dataset:{enabled:String(enabled)},action:'https://api.web3forms.com/submit',elements:{client_submitted_at:{value:''},product_interests:{value:''}},reportValidity:()=>valid&&!productChoices.some(input=>input.validityMessage),querySelector:s=>s==='.form-status'?status:button,querySelectorAll:s=>s==='fieldset'?[fieldset]:productChoices,addEventListener:(n,fn)=>handlers[n]=fn,setAttribute:(k,v)=>attributes[k]=v,removeAttribute:k=>delete attributes[k]};
 let requests=0,timer;
 const context={document:{documentElement:{classList:{add(){}}},querySelector:s=>null,querySelectorAll:s=>s==='form[data-enabled]'?[form]:[],addEventListener(){}},window:{matchMedia:()=>({addEventListener(){}})},AbortController,Date,FormData:class{constructor(form){this.form=form}},setTimeout:fn=>{timer=fn;return 1},clearTimeout(){timer=null},fetch:async(...args)=>{requests++;return fetchImpl(...args)}};
 vm.runInNewContext(source,context);
 return {form,status,button,fieldset,attributes,requests:()=>requests,submit:()=>handlers.submit?.({preventDefault(){}}),timeout:()=>timer?.()};
}
test('review mode never registers a submission handler',async()=>{const s=setup({enabled:false});await s.submit();assert.equal(s.requests(),0)});
test('invalid form never sends',async()=>{const s=setup({valid:false});await s.submit();assert.equal(s.requests(),0)});
test('confirmed provider success locks form and records client timestamp',async()=>{const s=setup();await s.submit();assert.equal(s.requests(),1);assert.equal(s.status.dataset.state,'success');assert.equal(s.fieldset.disabled,true);assert.match(s.form.elements.client_submitted_at.value,/^\d{4}-/);assert.equal(s.attributes['aria-busy'],undefined)});
test('duplicate clicks are blocked while pending',async()=>{let resolve;const s=setup({fetchImpl:()=>new Promise(r=>resolve=r)});const first=s.submit();await s.submit();assert.equal(s.requests(),1);assert.equal(s.button.disabled,true);resolve({ok:true,json:async()=>({success:true})});await first});
for(const [name,fetchImpl] of [
 ['provider rejection',async()=>({ok:true,json:async()=>({success:false})})],
 ['HTTP error',async()=>({ok:false,json:async()=>({success:true})})],
 ['network error',async()=>{throw new Error('offline')}],
 ['malformed response',async()=>({ok:true,json:async()=>{throw new Error('invalid JSON')}})],
 ['nonboolean success',async()=>({ok:true,json:async()=>({success:'true'})})]
])test(`${name} preserves form and permits retry`,async()=>{const s=setup({fetchImpl});await s.submit();assert.equal(s.status.dataset.state,'error');assert.equal(s.fieldset.disabled,false);assert.equal(s.button.disabled,false);await s.submit();assert.equal(s.requests(),2)});
test('timeout is reported as unconfirmed',async()=>{const s=setup({fetchImpl:(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>{const e=new Error('timeout');e.name='AbortError';reject(e)}))});const pending=s.submit();s.timeout();await pending;assert.equal(s.status.dataset.state,'error');assert.match(s.status.textContent,/in time/);assert.equal(s.button.disabled,false)});

test('selected products are included in the submission summary',async()=>{const choices=['P001 Band','White Tee'].map(text=>({checked:true,parentElement:{textContent:text},setCustomValidity(value){this.validityMessage=value},addEventListener(){}}));const s=setup({productChoices:choices});await s.submit();assert.equal(s.form.elements.product_interests.value,'P001 Band, White Tee');assert.equal(s.status.dataset.state,'success')});
test('empty product selection prevents submission',async()=>{const choice={checked:false,setCustomValidity(value){this.validityMessage=value},addEventListener(){}};const s=setup({productChoices:[choice]});await s.submit();assert.equal(s.requests(),0);assert.match(choice.validityMessage,/at least one/) });
