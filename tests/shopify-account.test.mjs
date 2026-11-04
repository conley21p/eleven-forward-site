import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {startAccountClient,verifyCustomer,safeReturnPath} from '../shopify-client/customer-account.mjs';
function fixture({user=null,url='https://fixture.myshopify.com/collections/shop?shop_sign_in=true',status=200,body={data:{customer:{id:'gid://shopify/Customer/test'}}},callbackError=false}={}) {
 const dom=new JSDOM(`<div data-account-entry data-account-authenticated="false"><div data-account-control><a data-account-login href="/account/login">Login</a></div><script type="application/json" data-account-config>{"clientId":"public-test-client","shopDomain":"fixture.myshopify.com","callbackPath":"/collections/shop","designMode":false}</script><template data-account-login-template><a data-account-login href="/account/login">Login</a></template><template data-account-profile-template><details><summary>Profile</summary><span data-account-email hidden></span><a href="/account/profile">Profile</a><a data-account-signout href="/account/logout">Sign out</a></details></template><span data-account-status></span></div>`,{url,pretendToBeVisual:true});
 const entry=dom.window.document.querySelector('[data-account-entry]');
 const calls={requests:[],redirects:[],removed:0,logout:0,refresh:0};
 const manager={getUser:async()=>user,removeUser:async()=>{calls.removed++;user=null;},signinRedirect:async args=>{calls.redirects.push(args);},signinSilent:async()=>{calls.refresh++;user={access_token:'renewed',expired:false};return user;},signinRedirectCallback:async()=>{if(callbackError)throw new Error('Invalid OIDC state');return user;},signoutRedirectCallback:async()=>({}),signoutRedirect:async()=>{calls.logout++;},events:{addAccessTokenExpired:callback=>{calls.expire=callback;}}};
 const fetch=async(url,options)=>{calls.requests.push({url,options});return String(url).includes('.well-known')?{ok:true,json:async()=>({graphql_api:'https://shopify.com/test/customer/api/2026-10/graphql'})}:{ok:status===200,status,json:async()=>body};};
 dom.window.sessionStorage.setItem('ef-account:public-test-client:probe-attempted','1');
 return {dom,entry,calls,manager,fetch};
}
test('a verified Customer Account API response renders Profile and Sign out',async()=>{
 const f=fixture({user:{access_token:'test-token',expired:false},body:{data:{customer:{id:'verified',emailAddress:{emailAddress:'customer@example.test'}}}}});
 await startAccountClient(f.entry,{window:f.dom.window,manager:f.manager,fetch:f.fetch});
 assert.equal(f.entry.dataset.accountAuthenticated,'true');
 assert.equal(f.entry.querySelector('summary').textContent,'Profile');
 assert.equal(f.entry.querySelector('[data-account-email]:not([hidden])').textContent,'customer@example.test');
 assert.deepEqual([...f.entry.querySelectorAll('[data-account-control] a')].map(a=>a.textContent),['Profile','Sign out']);
 const api=f.calls.requests[1];assert.equal(api.options.headers.Authorization,'test-token');assert.equal(api.options.credentials,'omit');
 f.entry.querySelector('[data-account-signout]').click();await new Promise(r=>setTimeout(r,0));
 assert.equal(f.calls.logout,1);assert.equal(f.entry.dataset.accountAuthenticated,'false');assert.equal(f.calls.removed,1);assert.equal(f.entry.querySelector('[data-account-control] [data-account-email]'),null);f.dom.window.close();
});
test('URL flags and the probe cache never establish a logged-in state',async()=>{
 const f=fixture();await startAccountClient(f.entry,{window:f.dom.window,manager:f.manager,fetch:f.fetch});
 assert.equal(f.entry.dataset.accountAuthenticated,'false');assert.equal(f.calls.requests.length,0);assert.equal(f.calls.redirects.length,0);f.dom.window.close();
});
test('an unrecognized account uses a single top-level silent OAuth probe',async()=>{
 const f=fixture();f.dom.window.sessionStorage.clear();await startAccountClient(f.entry,{window:f.dom.window,manager:f.manager,fetch:f.fetch});
 assert.equal(f.calls.redirects.length,1);assert.equal(f.calls.redirects[0].prompt,'none');assert.equal(f.entry.dataset.accountAuthenticated,'false');f.dom.window.close();
});
test('expired tokens renew before verification; rejected tokens remove the session',async()=>{
 const f=fixture({user:{access_token:'old',refresh_token:'refresh',expired:true},status:401});
 await startAccountClient(f.entry,{window:f.dom.window,manager:f.manager,fetch:f.fetch});
 assert.equal(f.calls.refresh,1);assert.equal(f.calls.requests[1].options.headers.Authorization,'renewed');assert.equal(f.calls.removed,1);assert.equal(f.entry.dataset.accountAuthenticated,'false');f.dom.window.close();
});
test('a failed API call or invalid OAuth callback cannot display Profile',async()=>{
 const f=fixture({user:{access_token:'test-token',expired:false},body:{errors:[{message:'denied'}]}});
 await startAccountClient(f.entry,{window:f.dom.window,manager:f.manager,fetch:f.fetch});assert.equal(f.entry.dataset.accountAuthenticated,'false');f.dom.window.close();
 const rejected=fixture({url:'https://fixture.myshopify.com/collections/shop?code=fake&state=forged',callbackError:true});
 await startAccountClient(rejected.entry,{window:rejected.dom.window,manager:rejected.manager,fetch:rejected.fetch});
 assert.equal(rejected.calls.removed,1);assert.equal(rejected.entry.dataset.accountAuthenticated,'false');assert.equal(rejected.dom.window.location.search,'');rejected.dom.window.close();
});
test('access without a valid token cannot query private customer data; return targets stay on the storefront',async()=>{
 let called=false;assert.equal(await verifyCustomer(null,'https://example.test',()=>{called=true;}),false);assert.equal(called,false);
 assert.equal(safeReturnPath('https://evil.test/','https://fixture.myshopify.com'),'/collections/shop');
 assert.equal(safeReturnPath('/cart','https://fixture.myshopify.com'),'/cart');
});

test('sign-out during a pending identity request cannot restore Profile',async()=>{
 const f=fixture({user:{access_token:'test-token',id_token:'test-id-token',expired:false}});
 const {renderAccount}=await import('../shopify-client/customer-account.mjs');
 renderAccount(f.entry,true);
 let resolveIdentity;
 const pendingFetch=async(url,options)=>String(url).includes('.well-known')?f.fetch(url,options):new Promise(resolve=>{resolveIdentity=resolve;});
 const started=startAccountClient(f.entry,{window:f.dom.window,manager:f.manager,fetch:pendingFetch});
 await new Promise(r=>setTimeout(r,0));
 f.entry.querySelector('[data-account-signout]').click();await new Promise(r=>setTimeout(r,0));
 resolveIdentity({ok:true,status:200,json:async()=>({data:{customer:{id:'test'}}})});await started;
 assert.equal(f.calls.logout,1);assert.equal(f.entry.dataset.accountAuthenticated,'false');f.dom.window.close();
});
test('OIDC library creates S256 PKCE and rejects callbacks without matching stored state',async()=>{
 const {OidcClient,WebStorageStateStore,InMemoryWebStorage}=await import('oidc-client-ts');
 const authority='https://shopify.com/authentication/test';
 const client=new OidcClient({authority,client_id:'public-test',redirect_uri:'https://fixture.myshopify.com/collections/shop',response_type:'code',scope:'openid email customer-account-api:full',metadata:{issuer:authority,authorization_endpoint:authority+'/authorize',token_endpoint:authority+'/token'},stateStore:new WebStorageStateStore({store:new InMemoryWebStorage()})});
 const request=await client.createSigninRequest({prompt:'none'});
 const url=new URL(request.url);
 assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.ok(url.searchParams.get('code_challenge').length>=43);assert.ok(url.searchParams.get('state'));
 await assert.rejects(client.processSigninResponse('https://fixture.myshopify.com/collections/shop?code=fake&state=forged'),/state/i);
});
