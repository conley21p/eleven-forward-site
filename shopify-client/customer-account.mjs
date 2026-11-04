import {UserManager, WebStorageStateStore} from 'oidc-client-ts';

export function safeReturnPath(value, origin) {
 const url = new URL(value || '/collections/shop', origin);
 return url.origin === origin ? url.pathname + url.search + url.hash : '/collections/shop';
}

// Only a successful, token-authenticated customer query establishes UI identity.
export async function verifyCustomer(user, apiUrl, fetcher = fetch) {
 if (!user?.access_token || user.expired) return false;
 const response = await fetcher(apiUrl, {
  method:'POST', cache:'no-store', credentials:'omit',
  headers:{'Content-Type':'application/json',Authorization:user.access_token},
  body:JSON.stringify({query:'query HeaderIdentity { customer { id emailAddress { emailAddress } } }'}),
  signal:AbortSignal.timeout(10000),
 });
 if (response.status === 401 || response.status === 403) return false;
 if (!response.ok) throw new Error('Account service unavailable');
 const result = await response.json();
 const customer = result.data?.customer;
 // Email is optional; a field-level restriction must not disable Profile.
 if (typeof customer?.id !== 'string' || result.errors?.some(error =>
  error.path?.[0] !== 'customer' || error.path?.[1] !== 'emailAddress')) return false;
 return {email:customer.emailAddress?.emailAddress || ''};
}

export function renderAccount(entry, authenticated, email = '') {
 const template = entry.querySelector(authenticated ? '[data-account-profile-template]' : '[data-account-login-template]');
 if (!template) return;
 entry.querySelector('[data-account-control]').replaceChildren(template.content.cloneNode(true));
 const identity = entry.querySelector('[data-account-control] [data-account-email]');
 if (identity && authenticated && email) {
  identity.textContent = email;
  identity.hidden = false;
 }
 entry.dataset.accountAuthenticated = String(authenticated);
 entry.removeAttribute('aria-busy');
}

export async function startAccountClient(entry, options = {}) {
 const win = options.window || window;
 const config = JSON.parse(entry.querySelector('[data-account-config]').textContent);
 if (!config.clientId || config.designMode || win.top !== win.self) return;
 const domain = config.shopDomain;
 if (!/^[a-z0-9-]+\.myshopify\.com$/i.test(domain)) throw new Error('Invalid store domain');
 const prefix = `ef-account:${config.clientId}:`;
 const storage = win.sessionStorage; // Tab-scoped OAuth state/tokens; never a logged-in boolean.
 const callback = new URL(config.callbackPath,win.location.origin).href;
 const manager = options.manager || new UserManager({
  authority:`https://${domain}`,
  metadataUrl:`https://${domain}/.well-known/openid-configuration`,
  client_id:config.clientId, redirect_uri:callback, post_logout_redirect_uri:callback,
  response_type:'code', scope:'openid email customer-account-api:full',
  loadUserInfo:false, automaticSilentRenew:false, monitorSession:false,
  requestTimeoutInSeconds:10,
  userStore:new WebStorageStateStore({store:storage,prefix}),
  stateStore:new WebStorageStateStore({store:storage,prefix:`${prefix}state:`}),
 });
 const fetcher = options.fetch || win.fetch.bind(win);
 let navigating = false, checking, generation = 0;
 let nativeSession = Boolean(entry.querySelector('[data-native-account]'));
 let oauthSession = false;
 const channel = typeof win.BroadcastChannel === 'function' ? new win.BroadcastChannel(prefix) : null;
 if (channel) channel.onmessage = async event => {
  if (event.data !== 'signed-out') return;
  generation++; nativeSession = false; oauthSession = false; storage.setItem(probeKey,'1');
  await manager.removeUser(); renderAccount(entry,false);
 };
 const status = message => { entry.querySelector('[data-account-status]').textContent = message; };
 const path = () => win.location.pathname + win.location.search + win.location.hash;
 const probeKey = `${prefix}probe-attempted`;
 async function redirectLogin(silent = false) {
  if (navigating) return;
  navigating = true; entry.setAttribute('aria-busy','true');
  try {
   const nonce = Array.from(win.crypto.getRandomValues(new Uint8Array(32)),byte => byte.toString(16).padStart(2,'0')).join('');
   await manager.signinRedirect({nonce,...(silent ? {prompt:'none'} : {}),state:{returnTo:safeReturnPath(path(),win.location.origin)}});
  } catch (_) {
   navigating = false; entry.removeAttribute('aria-busy');
   status('Sign-in could not open. Please try again.');
  }
 }
 async function getApiUrl() {
  const response = await fetcher(`https://${domain}/.well-known/customer-account-api`,{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error('Account discovery failed');
  const endpoint = new URL((await response.json()).graphql_api);
  // Trust the store's HTTPS discovery document, including configured account vanity domains.
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('Invalid account API');
  return endpoint.href;
 }
 async function check() {
  if (checking || navigating) return checking;
  checking = (async () => {
   entry.setAttribute('aria-busy','true');
   const currentGeneration = generation;
   try {
    let user = await manager.getUser();
    if (user?.expired && user.refresh_token) user = await manager.signinSilent(); // Refresh-token grant; no iframe path.
    if (user?.expired) { await manager.removeUser(); user = null; }
    const identity = user && await verifyCustomer(user,await getApiUrl(),fetcher);
    if (currentGeneration !== generation || navigating) return;
    if (identity) {
     oauthSession = true;
     renderAccount(entry,true,identity.email); status(''); return;
    }
    if (user) await manager.removeUser();
    if (nativeSession && !oauthSession) return;
    oauthSession = false;
    renderAccount(entry,false);
    if (!storage.getItem(probeKey)) {
     storage.setItem(probeKey,'1'); // Redirect-loop limiter, not proof of authentication.
     await redirectLogin(true); // Top-level OAuth; Shopify forbids iframe authorization.
    }
   } catch (_) {
    if (currentGeneration !== generation || navigating || (nativeSession && !oauthSession)) return;
    renderAccount(entry,false); status('Unable to verify your account. Please try signing in.');
   } finally { entry.removeAttribute('aria-busy'); }
  })();
  await checking; checking = null;
 }
 entry.addEventListener('click',async event => {
  if (event.target.closest('[data-account-login]')) {
   event.preventDefault(); await redirectLogin();
  } else if (event.target.closest('[data-account-signout]')) {
   if (nativeSession && !oauthSession) return; // Shopify owns native sign-out.
   event.preventDefault(); if (navigating) return;
   navigating = true; generation++; storage.setItem(probeKey,'1');
   channel?.postMessage('signed-out');
   const user = await manager.getUser();
   await manager.removeUser(); renderAccount(entry,false);
   try { await manager.signoutRedirect({id_token_hint:user?.id_token,state:{mode:'logout'}}); }
   catch (_) { navigating = false; status('Local session cleared. Open Profile to finish signing out of Shopify.'); }
  }
 });
 const params = new URLSearchParams(win.location.search);
 if (win.location.pathname === new URL(callback).pathname && params.has('state')) {
  storage.setItem(probeKey,'1');
  try {
   if (params.has('code') || params.has('error')) {
    const user = await manager.signinRedirectCallback(win.location.href);
    win.history.replaceState(null,'',safeReturnPath(user.state?.returnTo,win.location.origin));
   } else {
    await manager.signoutRedirectCallback(win.location.href);
    win.history.replaceState(null,'',config.callbackPath);
   }
  } catch (_) {
   // The OIDC library validates transaction state, PKCE and ID-token claims.
   await manager.removeUser(); win.history.replaceState(null,'',config.callbackPath);
   renderAccount(entry,false);
   if (!['login_required','interaction_required','consent_required'].includes(params.get('error'))) status('Sign-in was not completed. Please try again.');
  }
 }
 manager.events.addAccessTokenExpired(() => { renderAccount(entry,false); check(); });
 win.addEventListener('focus',check);
 win.addEventListener('pageshow',event => { if (event.persisted) check(); });
 await check();
 return {check};
}

if (typeof document !== 'undefined') {
 const entry = document.querySelector('[data-account-client="oauth"]');
 if (entry) startAccountClient(entry).catch(() => {
  entry.removeAttribute('aria-busy');
  entry.querySelector('[data-account-status]').textContent = 'Account sign-in is temporarily unavailable.';
 });
}
