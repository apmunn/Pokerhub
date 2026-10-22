const CACHE='pokerhub-static-v8';
const ASSETS=['./','./index.html','./multiplayer.html','./variants.html','./portal.html','./offline.html','./privacy.html','./terms.html','./404.html','./assets/styles.css','./assets/motion.css','./assets/unified.css','./assets/live.js','./assets/portal.css','./assets/data.js','./assets/game.js','./assets/app.js','./assets/portal.js','./assets/icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pokerhub-static-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}))}
   return response
  }).catch(async()=>await caches.match(request)||await caches.match('./offline.html')||new Response('Offline',{status:503,headers:{'Content-Type':'text/plain'}})));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
  if(response.ok&&/\.(?:css|js|svg|webmanifest)(?:\?.*)?$/i.test(new URL(request.url).pathname)){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}))}
  return response
 })));
});
